import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import type { PayosWebhookDto } from './dto/payos-webhook.dto';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRenter(userId: string) {
    return this.prisma.renterWallet.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });
  }

  async getMutux(userId: string) {
    const wallet = await this.prisma.mutuxWallet.findUnique({
      where: { user_id: userId },
    });
    if (!wallet) {
      return {
        id: null,
        granted: false,
        userId,
        totalLimit: 0,
        displayBalance: 0,
        lockedBalance: 0,
        outstandingDebt: 0,
        status: 'not_granted' as const,
        approvedAt: null,
        expiredAt: null,
      };
    }
    return this.toMutuxWallet(wallet);
  }

  async repayMutuxDebt(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM renter_wallets WHERE user_id = ${userId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM mutux_wallets WHERE user_id = ${userId}::uuid FOR UPDATE`;
      const [renterWallet, mutuxWallet] = await Promise.all([
        tx.renterWallet.findUnique({ where: { user_id: userId } }),
        tx.mutuxWallet.findUnique({ where: { user_id: userId } }),
      ]);
      if (!mutuxWallet) {
        throw new NotFoundException({
          error: 'CREDIT_WALLET_NOT_FOUND',
          message: 'Mutux credit wallet not found',
        });
      }
      if (!renterWallet) {
        throw new ConflictException({
          error: 'INSUFFICIENT_RENTER_BALANCE',
          message: 'Renter wallet balance is insufficient',
        });
      }
      if (renterWallet.status !== 'active' || mutuxWallet.status !== 'active') {
        throw new ConflictException({
          error: 'WALLET_INACTIVE',
          message: 'Both wallets must be active',
        });
      }
      const debt = mutuxWallet.outstanding_debt;
      if (!debt.greaterThan(0)) {
        throw new ConflictException({
          error: 'NO_OUTSTANDING_DEBT',
          message: 'There is no outstanding credit debt',
        });
      }
      if (renterWallet.balance.lessThan(debt)) {
        throw new ConflictException({
          error: 'INSUFFICIENT_RENTER_BALANCE',
          message: 'Renter wallet balance is insufficient',
        });
      }
      const renterBalanceAfter = renterWallet.balance.minus(debt);
      const creditBalanceAfter = mutuxWallet.display_balance.plus(debt);
      await tx.renterWallet.update({
        where: { id: renterWallet.id },
        data: { balance: renterBalanceAfter },
      });
      await tx.mutuxWallet.update({
        where: { id: mutuxWallet.id },
        data: {
          outstanding_debt: 0,
          display_balance: creditBalanceAfter,
        },
      });
      await tx.renterWalletTransaction.create({
        data: {
          wallet_id: renterWallet.id,
          type: 'credit_debt_repay',
          amount: debt,
          balance_before: renterWallet.balance,
          balance_after: renterBalanceAfter,
          reference: `credit-debt-repay:${mutuxWallet.id}:${Date.now()}`,
        },
      });
      await tx.creditTransaction.create({
        data: {
          mutux_wallet_id: mutuxWallet.id,
          type: 'debt_repay',
          amount: debt,
          display_balance_before: mutuxWallet.display_balance,
          display_balance_after: creditBalanceAfter,
          direction: 'in',
          note: 'Outstanding debt repaid from renter wallet',
          status: 'success',
        },
      });
      return {
        repaidAmount: debt.toNumber(),
        renterWalletBalance: renterBalanceAfter.toNumber(),
        mutuxWallet: this.toMutuxWallet({
          ...mutuxWallet,
          outstanding_debt: new Prisma.Decimal(0),
          display_balance: creditBalanceAfter,
        }),
      };
    });
  }

  async getLender(userId: string, page: number, limit: number) {
    const wallet = await this.prisma.lenderWallet.findUnique({
      where: { lender_id: userId },
    });
    if (!wallet) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Lender wallet not found',
      });
    }

    const [transactions, total] = await Promise.all([
      this.prisma.lenderWalletTransaction.findMany({
        where: { lender_wallet_id: wallet.id },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lenderWalletTransaction.count({
        where: { lender_wallet_id: wallet.id },
      }),
    ]);

    return {
      balance: wallet.balance,
      totalWithdrawn: wallet.total_withdrawn,
      status: wallet.status,
      transactions: {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async withdraw(userId: string, input: CreateWithdrawalDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM lender_wallets WHERE lender_id = ${userId}::uuid FOR UPDATE`;
      const wallet = await tx.lenderWallet.findUnique({
        where: { lender_id: userId },
      });
      if (!wallet)
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Lender wallet not found',
        });
      if (wallet.status !== 'active')
        throw new BadRequestException({
          error: 'WALLET_INACTIVE',
          message: 'Lender wallet is not active',
        });

      const amount = new Prisma.Decimal(input.amount);
      if (wallet.balance.lessThan(amount))
        throw new BadRequestException({
          error: 'INSUFFICIENT_FUNDS',
          message: 'Lender wallet balance is insufficient',
        });

      let bankAccount = await tx.bankAccount.findFirst({
        where: {
          user_id: userId,
          bank_code: input.bankCode,
          account_number: input.accountNumber,
        },
      });
      if (!bankAccount) {
        bankAccount = await tx.bankAccount.create({
          data: {
            user_id: userId,
            bank_name: input.bankCode,
            bank_code: input.bankCode,
            account_number: input.accountNumber,
            account_holder: input.accountHolder,
          },
        });
      }

      const balanceAfter = wallet.balance.minus(amount);
      const withdrawal = await tx.withdrawal.create({
        data: {
          lender_wallet_id: wallet.id,
          bank_account_id: bankAccount.id,
          amount,
        },
      });
      await tx.lenderWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          total_withdrawn: { increment: amount },
        },
      });
      await tx.lenderWalletTransaction.create({
        data: {
          lender_wallet_id: wallet.id,
          type: 'withdrawal',
          amount,
          balance_before: wallet.balance,
          balance_after: balanceAfter,
          note: `Withdrawal request ${withdrawal.id}`,
        },
      });

      return {
        id: withdrawal.id,
        status: withdrawal.status,
        amount: amount.toNumber(),
        balance: balanceAfter.toNumber(),
      };
    });
  }

  async checkout(userId: string, amount: number, method: string) {
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException('Amount must be positive');
    if (method !== 'payos')
      throw new BadRequestException('Method must be payos');
    const wallet = await this.getRenter(userId);
    const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const topup = await this.prisma.walletTopup.create({
      data: {
        wallet_id: wallet.id,
        amount,
        order_code: String(orderCode),
      },
    });
    return {
      topupId: topup.id,
      orderCode,
      amount: Number(topup.amount),
      status: 'pending' as const,
      paymentInstructions: {
        bankCode: process.env.MOCK_PAYOS_BANK_CODE || 'MB',
        accountNumber: process.env.MOCK_PAYOS_ACCOUNT_NUMBER || '999988886666',
        accountName: process.env.MOCK_PAYOS_ACCOUNT_NAME || 'MUTUX DEMO',
        transferContent: `MUTUX ${orderCode}`,
      },
    };
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
      if (topup.status === 'success') {
        if (
          providerReference &&
          topup.provider_reference !== providerReference
        ) {
          throw new ConflictException({
            error: 'PROVIDER_REFERENCE_MISMATCH',
            message: 'Top-up was completed with another provider reference',
          });
        }
        return this.completionResponse(topup.id, topup.wallet.balance);
      }
      if (topup.status !== 'pending')
        throw new BadRequestException({
          error: 'TOPUP_NOT_PENDING',
          message: 'Top-up is not pending',
        });
      await tx.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${topup.wallet_id}::uuid FOR UPDATE`;
      const wallet = await tx.renterWallet.findUniqueOrThrow({
        where: { id: topup.wallet_id },
      });
      if (providerReference) {
        const reused = await tx.walletTopup.findUnique({
          where: { provider_reference: providerReference },
        });
        if (reused && reused.id !== topup.id)
          throw new ConflictException({
            error: 'PROVIDER_REFERENCE_REUSED',
            message: 'Provider reference was already used',
          });
      }
      const reference = topup.order_code;
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
      await tx.walletTopup.update({
        where: { id },
        data: {
          status: 'success',
          provider_reference: providerReference,
          completed_at: new Date(),
        },
      });
      return this.completionResponse(
        topup.id,
        wallet.balance.plus(topup.amount),
      );
    });
  }

  async webhook(body: PayosWebhookDto, signature?: string) {
    this.verifyPayosSignature(body, signature);
    const code = String(body.data.orderCode);
    const topup = await this.prisma.walletTopup.findFirst({
      where: { order_code: code },
    });
    if (!topup)
      throw new NotFoundException({
        error: 'TOPUP_NOT_FOUND',
        message: 'Top-up not found',
      });
    if (!topup.amount.equals(body.data.amount))
      throw new BadRequestException({
        error: 'AMOUNT_MISMATCH',
        message: 'Webhook amount does not match top-up amount',
      });
    if (!body.success || body.code !== '00') {
      const reused = await this.prisma.walletTopup.findUnique({
        where: { provider_reference: body.data.reference },
      });
      if (reused && reused.id !== topup.id)
        throw new ConflictException({
          error: 'PROVIDER_REFERENCE_REUSED',
          message: 'Provider reference was already used',
        });
      if (topup.status === 'pending') {
        await this.prisma.walletTopup.update({
          where: { id: topup.id },
          data: {
            status: 'failed',
            provider_reference: body.data.reference,
            completed_at: new Date(),
          },
        });
      }
      throw new BadRequestException({
        error: 'PAYMENT_FAILED',
        message: 'Provider reported a failed payment',
      });
    }
    return this.completeTopup(topup.id, undefined, body.data.reference);
  }

  private verifyPayosSignature(body: PayosWebhookDto, signature?: string) {
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

    const payload = Buffer.from(stableStringify(body));
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

  private completionResponse(topupId: string, balance: { toNumber(): number }) {
    return {
      topupId,
      status: 'success' as const,
      walletBalance: balance.toNumber(),
    };
  }

  private toMutuxWallet(wallet: {
    id: string;
    user_id: string;
    total_limit: Prisma.Decimal;
    display_balance: Prisma.Decimal;
    locked_balance: Prisma.Decimal;
    outstanding_debt: Prisma.Decimal;
    status: string;
    approved_at: Date | null;
    expired_at: Date | null;
  }) {
    return {
      id: wallet.id,
      granted: true,
      userId: wallet.user_id,
      totalLimit: wallet.total_limit.toNumber(),
      displayBalance: wallet.display_balance.toNumber(),
      lockedBalance: wallet.locked_balance.toNumber(),
      outstandingDebt: wallet.outstanding_debt.toNumber(),
      status: wallet.status,
      approvedAt: wallet.approved_at,
      expiredAt: wallet.expired_at,
    };
  }
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
