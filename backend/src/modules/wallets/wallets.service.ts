import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHmac, timingSafeEqual } from 'crypto';

export interface PayosWebhookBody {
  orderCode?: unknown;
  description?: unknown;
  data?: {
    orderCode?: unknown;
    description?: unknown;
    reference?: string;
  };
}

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRenter(userId: string) {
    return this.prisma.renterWallet.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });
  }

  async checkout(userId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Amount must be positive');
    const wallet = await this.getRenter(userId);
    return this.prisma.walletTopup.create({
      data: {
        wallet_id: wallet.id,
        amount,
        order_code: `TOPUP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      },
    });
  }

  async completeTopup(id: string, userId?: string, providerReference?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM wallet_topups WHERE id = ${id}::uuid FOR UPDATE`;
      const topup = await tx.walletTopup.findUnique({
        where: { id },
        include: { wallet: true },
      });
      if (!topup || (userId && topup.wallet.user_id !== userId))
        throw new NotFoundException('Top-up not found');
      if (topup.status === 'success') return topup;
      await tx.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${topup.wallet_id}::uuid FOR UPDATE`;
      const wallet = await tx.renterWallet.findUniqueOrThrow({
        where: { id: topup.wallet_id },
      });
      const reference = providerReference ?? topup.order_code;
      const existingTransaction = await tx.renterWalletTransaction.findUnique({
        where: { reference },
      });
      if (!existingTransaction) {
        const balanceAfter = wallet.balance.plus(topup.amount);
        await tx.renterWallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        });
        await tx.renterWalletTransaction.create({
          data: {
            wallet_id: wallet.id,
            type: 'topup',
            amount: topup.amount,
            balance_before: wallet.balance,
            balance_after: balanceAfter,
            reference,
          },
        });
      }
      return tx.walletTopup.update({
        where: { id },
        data: {
          status: 'success',
          provider_reference: providerReference,
          completed_at: new Date(),
        },
      });
    });
  }

  async webhook(body: PayosWebhookBody, signature?: string, rawBody?: Buffer) {
    this.verifyPayosSignature(body, signature, rawBody);
    const code = this.toWebhookString(
      body?.data?.orderCode ??
        body?.orderCode ??
        body?.data?.description ??
        body?.description ??
        '',
    );
    const topup = await this.prisma.walletTopup.findFirst({
      where: { order_code: code },
    });
    if (!topup) throw new NotFoundException('Top-up not found');
    return this.completeTopup(topup.id, undefined, body?.data?.reference);
  }

  private verifyPayosSignature(
    body: PayosWebhookBody,
    signature?: string,
    rawBody?: Buffer,
  ) {
    const secret = process.env.PAYOS_WEBHOOK_SECRET;
    if (!secret)
      throw new UnauthorizedException({
        error: 'INVALID_SIGNATURE',
        message: 'INVALID_SIGNATURE',
      });
    if (!signature)
      throw new UnauthorizedException({
        error: 'INVALID_SIGNATURE',
        message: 'INVALID_SIGNATURE',
      });

    const payload = rawBody?.length
      ? rawBody
      : Buffer.from(JSON.stringify(body));
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const received = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException({
        error: 'INVALID_SIGNATURE',
        message: 'INVALID_SIGNATURE',
      });
    }
  }

  private toWebhookString(value: unknown) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  }
}
