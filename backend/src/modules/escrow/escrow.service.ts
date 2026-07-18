import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DepositTypeEnum, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowResult, IEscrowService } from './escrow.service.interface';

@Injectable()
export class EscrowService implements IEscrowService {
  constructor(private readonly prisma: PrismaService) {}

  async lock(orderId: string): Promise<EscrowResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.escrow_wallet) return this.toResult(order.escrow_wallet);
      if (order.deposit_type !== DepositTypeEnum.traditional) {
        throw new BadRequestException({
          error: 'UNSUPPORTED_DEPOSIT_TYPE',
          message: 'Only traditional deposit lock is supported',
        });
      }

      const reference = `LOCK-${orderId}`;
      const existingTransaction = await tx.renterWalletTransaction.findUnique({
        where: { reference },
      });
      if (existingTransaction) {
        const escrow = await tx.escrowWallet.findUnique({
          where: { rental_order_id: orderId },
        });
        if (escrow) return this.toResult(escrow);
        throw new BadRequestException({
          error: 'ESCROW_LOCK_INCONSISTENT',
          message:
            'Escrow lock transaction already exists without escrow wallet',
        });
      }

      const wallet = await tx.renterWallet.findUnique({
        where: { user_id: order.renter_id },
      });
      if (!wallet)
        throw new BadRequestException({
          error: 'INSUFFICIENT_CASH',
          message: 'INSUFFICIENT_CASH',
        });
      await tx.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${wallet.id}::uuid FOR UPDATE`;

      const availableBalance = wallet.balance.minus(wallet.locked_balance);
      const requiredCash = order.deposit_amount.plus(order.rental_fee);
      if (availableBalance.lessThan(requiredCash)) {
        throw new BadRequestException({
          error: 'INSUFFICIENT_CASH',
          message: 'INSUFFICIENT_CASH',
        });
      }

      const balanceAfter = wallet.balance.minus(order.rental_fee);
      const lockedBalanceAfter = wallet.locked_balance.plus(
        order.deposit_amount,
      );

      await tx.renterWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          locked_balance: lockedBalanceAfter,
        },
      });
      await tx.renterWalletTransaction.create({
        data: {
          wallet_id: wallet.id,
          type: 'order_lock',
          amount: order.rental_fee,
          balance_before: wallet.balance,
          balance_after: balanceAfter,
          reference,
        },
      });
      const escrow = await tx.escrowWallet.create({
        data: {
          rental_order_id: order.id,
          amount: order.deposit_amount,
          source: 'renter_cash',
          status: 'locked',
        },
      });

      return this.toResult(escrow);
    });
  }

  release(orderId: string): Promise<EscrowResult> {
    return Promise.reject(
      new BadRequestException({
        error: 'NOT_IMPLEMENTED',
        message: `release(${orderId}) is not implemented yet`,
      }),
    );
  }

  compensate(orderId: string, deductAmount: number): Promise<EscrowResult> {
    return Promise.reject(
      new BadRequestException({
        error: 'NOT_IMPLEMENTED',
        message: `compensate(${orderId}, ${deductAmount}) is not implemented yet`,
      }),
    );
  }

  private toResult(escrow: {
    id: string;
    rental_order_id: string;
    amount: Prisma.Decimal;
    source: 'renter_cash' | 'credit_line';
    status: 'locked' | 'pending_return' | 'released' | 'compensated';
  }): EscrowResult {
    return {
      escrowId: escrow.id,
      orderId: escrow.rental_order_id,
      amount: escrow.amount.toNumber(),
      source: escrow.source,
      status: escrow.status,
    };
  }
}
