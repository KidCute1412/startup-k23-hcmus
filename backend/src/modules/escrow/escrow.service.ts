import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DepositTypeEnum, Prisma, WalletStatusType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowReconciliationService } from './escrow-reconciliation.service';
import { EscrowResult, IEscrowService } from './escrow.service.interface';

@Injectable()
export class EscrowService implements IEscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliation: EscrowReconciliationService,
  ) {}

  async lock(orderId: string): Promise<EscrowResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.escrow_wallet) return this.toResult(order.escrow_wallet);

      let cashWallet:
        | {
            id: string;
            balance: Prisma.Decimal;
            locked_balance: Prisma.Decimal;
          }
        | undefined;

      if (order.deposit_type === DepositTypeEnum.traditional) {
        const reference = `LOCK-${orderId}`;
        const existingTransaction = await tx.renterWalletTransaction.findUnique(
          {
            where: { reference },
          },
        );
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

        const walletReference = await tx.renterWallet.findUnique({
          where: { user_id: order.renter_id },
          select: { id: true },
        });
        if (!walletReference)
          throw new BadRequestException({
            error: 'INSUFFICIENT_CASH',
            message: 'INSUFFICIENT_CASH',
          });
        await tx.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${walletReference.id}::uuid FOR UPDATE`;
        const wallet = await tx.renterWallet.findUniqueOrThrow({
          where: { id: walletReference.id },
        });

        const availableBalance = wallet.balance.minus(wallet.locked_balance);
        const requiredCash = order.deposit_amount.plus(order.rental_fee);
        if (availableBalance.lessThan(requiredCash)) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CASH',
            message: 'INSUFFICIENT_CASH',
          });
        }
        cashWallet = wallet;
      }

      let creditWallet:
        | {
            id: string;
            total_limit: Prisma.Decimal;
            display_balance: Prisma.Decimal;
            locked_balance: Prisma.Decimal;
            outstanding_debt: Prisma.Decimal;
          }
        | undefined;
      let creditDisplayBalanceAfter: Prisma.Decimal | undefined;
      let creditLockedBalanceAfter: Prisma.Decimal | undefined;

      if (order.deposit_type === DepositTypeEnum.credit_line) {
        const creditWalletReference = await tx.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
          select: { id: true },
        });
        if (!creditWalletReference) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CREDIT',
            message: 'INSUFFICIENT_CREDIT',
          });
        }

        await tx.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditWalletReference.id}::uuid FOR UPDATE`;
        const lockedCreditWallet = await tx.mutuxWallet.findUniqueOrThrow({
          where: { id: creditWalletReference.id },
        });
        const availableCredit = lockedCreditWallet.total_limit
          .minus(lockedCreditWallet.locked_balance)
          .minus(lockedCreditWallet.outstanding_debt);
        const creditUnavailable =
          lockedCreditWallet.status !== WalletStatusType.active ||
          (lockedCreditWallet.expired_at !== null &&
            lockedCreditWallet.expired_at <= new Date());
        if (
          creditUnavailable ||
          availableCredit.lessThan(order.deposit_amount)
        ) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CREDIT',
            message: 'INSUFFICIENT_CREDIT',
          });
        }

        creditWallet = lockedCreditWallet;
        creditDisplayBalanceAfter = lockedCreditWallet.display_balance.minus(
          order.deposit_amount,
        );
        creditLockedBalanceAfter = lockedCreditWallet.locked_balance.plus(
          order.deposit_amount,
        );
      }

      if (cashWallet) {
        const balanceAfter = cashWallet.balance.minus(order.rental_fee);
        const lockedBalanceAfter = cashWallet.locked_balance.plus(
          order.deposit_amount,
        );

        await tx.renterWallet.update({
          where: { id: cashWallet.id },
          data: {
            balance: balanceAfter,
            locked_balance: lockedBalanceAfter,
          },
        });
        await tx.renterWalletTransaction.create({
          data: {
            wallet_id: cashWallet.id,
            type: 'order_lock',
            amount: order.rental_fee,
            balance_before: cashWallet.balance,
            balance_after: balanceAfter,
            reference: `LOCK-${orderId}`,
          },
        });
      }

      if (
        creditWallet &&
        creditDisplayBalanceAfter &&
        creditLockedBalanceAfter
      ) {
        await tx.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            display_balance: creditDisplayBalanceAfter,
            locked_balance: creditLockedBalanceAfter,
          },
        });
        await tx.creditTransaction.create({
          data: {
            mutux_wallet_id: creditWallet.id,
            type: 'deposit_lock',
            amount: order.deposit_amount,
            display_balance_before: creditWallet.display_balance,
            display_balance_after: creditDisplayBalanceAfter,
            direction: 'out',
            ref_type: 'rental_order',
            ref_id: order.id,
            note: `Lock deposit for rental order ${order.id}`,
            status: 'success',
          },
        });
      }

      const escrow = await tx.escrowWallet.create({
        data: {
          rental_order_id: order.id,
          amount: order.deposit_amount,
          source:
            order.deposit_type === DepositTypeEnum.credit_line
              ? 'credit_line'
              : 'renter_cash',
          status: 'locked',
        },
      });

      if (creditWallet) {
        await this.reconciliation.checkCreditLineBalance(tx, creditWallet.id);
      }

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
