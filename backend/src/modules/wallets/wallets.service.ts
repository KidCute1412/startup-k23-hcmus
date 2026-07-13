import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRenter(userId: string) {
    return this.prisma.renterWallet.upsert({ where: { user_id: userId }, create: { user_id: userId }, update: {} });
  }

  async checkout(userId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Amount must be positive');
    const wallet = await this.getRenter(userId);
    return this.prisma.walletTopup.create({ data: { wallet_id: wallet.id, amount, order_code: `TOPUP-${Date.now()}-${Math.floor(Math.random() * 10000)}` } });
  }

  async completeTopup(id: string, userId?: string, providerReference?: string) {
    return this.prisma.$transaction(async (tx) => {
      const topup = await tx.walletTopup.findUnique({ where: { id }, include: { wallet: true } });
      if (!topup || (userId && topup.wallet.user_id !== userId)) throw new NotFoundException('Top-up not found');
      if (topup.status === 'success') return topup;
      const wallet = await tx.renterWallet.update({ where: { id: topup.wallet_id }, data: { balance: { increment: topup.amount } } });
      await tx.renterWalletTransaction.create({ data: { wallet_id: wallet.id, type: 'topup', amount: topup.amount, balance_before: wallet.balance.minus(topup.amount), balance_after: wallet.balance, reference: providerReference ?? topup.order_code } });
      return tx.walletTopup.update({ where: { id }, data: { status: 'success', provider_reference: providerReference, completed_at: new Date() } });
    });
  }

  async webhook(body: any) {
    const code = body?.data?.description ?? body?.description ?? '';
    const topup = await this.prisma.walletTopup.findFirst({ where: { order_code: code } });
    if (!topup) throw new NotFoundException('Top-up not found');
    return this.completeTopup(topup.id, undefined, body?.data?.reference);
  }
}
