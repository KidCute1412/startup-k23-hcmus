import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DepositTypeEnum, Prisma, WalletStatusType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowReconciliationService } from './escrow-reconciliation.service';
import { EscrowResult, IEscrowService } from './escrow.service.interface';
import {
  CREDIT_USAGE_FEE,
  creditFeeReference,
} from '../wallets/credit-fee-policy';

const PLATFORM_FEE_RATE = 0.15;

const computePlatformFee = (rentalFee: Prisma.Decimal) =>
  rentalFee.mul(PLATFORM_FEE_RATE);
const computeLenderIncome = (rentalFee: Prisma.Decimal) =>
  rentalFee.sub(computePlatformFee(rentalFee));

@Injectable()
export class EscrowService implements IEscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reconciliation: EscrowReconciliationService,
  ) {}

  async lock(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowResult> {
    const execute = async (client: Prisma.TransactionClient) => {
      await client.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await client.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      const reference = `LOCK-${orderId}`;
      const existingTransaction =
        await client.renterWalletTransaction.findUnique({
          where: { reference },
        });
      if (order.escrow_wallet) {
        const expectedSource =
          order.deposit_type === DepositTypeEnum.credit_line
            ? 'credit_line'
            : 'renter_cash';
        if (
          order.escrow_wallet.status !== 'locked' ||
          order.escrow_wallet.source !== expectedSource ||
          !order.escrow_wallet.amount.equals(order.deposit_amount) ||
          !existingTransaction
        ) {
          throw new BadRequestException({
            error: 'ESCROW_LOCK_INCONSISTENT',
            message:
              'Existing escrow does not match the order deposit and lock ledger',
          });
        }
        return this.toResult(order.escrow_wallet);
      }

      if (existingTransaction) {
        throw new BadRequestException({
          error: 'ESCROW_LOCK_INCONSISTENT',
          message:
            'Escrow lock transaction exists without a matching locked escrow',
        });
      }

      const walletRef = await client.renterWallet.findUnique({
        where: { user_id: order.renter_id },
        select: { id: true },
      });
      if (!walletRef)
        throw new BadRequestException({
          error: 'INSUFFICIENT_CASH',
          message: 'INSUFFICIENT_CASH',
        });

      await client.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${walletRef.id}::uuid FOR UPDATE`;
      const cashWallet = await client.renterWallet.findUniqueOrThrow({
        where: { id: walletRef.id },
      });

      const availableCash = cashWallet.balance.minus(cashWallet.locked_balance);

      if (order.deposit_type === DepositTypeEnum.traditional) {
        const requiredCash = order.deposit_amount.plus(order.rental_fee);
        if (availableCash.lessThan(requiredCash)) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CASH',
            message: 'INSUFFICIENT_CASH',
          });
        }

        const balanceAfter = cashWallet.balance.minus(order.rental_fee);
        const lockedBalanceAfter = cashWallet.locked_balance.plus(
          order.deposit_amount,
        );

        await client.renterWallet.update({
          where: { id: cashWallet.id },
          data: {
            balance: balanceAfter,
            locked_balance: lockedBalanceAfter,
          },
        });
        await client.renterWalletTransaction.create({
          data: {
            wallet_id: cashWallet.id,
            type: 'order_lock',
            amount: order.rental_fee,
            balance_before: cashWallet.balance,
            balance_after: balanceAfter,
            reference,
          },
        });
      } else {
        const feeReference = creditFeeReference(order.renter_id);
        const feeTransaction = await client.renterWalletTransaction.findUnique({
          where: { reference: feeReference },
        });
        const usageFee = feeTransaction
          ? new Prisma.Decimal(0)
          : CREDIT_USAGE_FEE;
        const requiredCash = order.rental_fee.plus(usageFee);
        if (availableCash.lessThan(requiredCash)) {
          throw new BadRequestException({
            error: usageFee.greaterThan(0)
              ? 'INSUFFICIENT_BALANCE_FOR_CREDIT_FEE'
              : 'INSUFFICIENT_CASH',
            message: usageFee.greaterThan(0)
              ? 'Renter wallet balance is insufficient for the monthly credit usage fee'
              : 'INSUFFICIENT_CASH',
          });
        }

        const balanceAfter = cashWallet.balance.minus(order.rental_fee);

        await client.renterWallet.update({
          where: { id: cashWallet.id },
          data: { balance: balanceAfter },
        });
        await client.renterWalletTransaction.create({
          data: {
            wallet_id: cashWallet.id,
            type: 'order_lock',
            amount: order.rental_fee,
            balance_before: cashWallet.balance,
            balance_after: balanceAfter,
            reference,
          },
        });

        if (!feeTransaction) {
          const feeBalanceAfter = balanceAfter.minus(CREDIT_USAGE_FEE);
          await client.renterWallet.update({
            where: { id: cashWallet.id },
            data: { balance: feeBalanceAfter },
          });
          await client.renterWalletTransaction.create({
            data: {
              wallet_id: cashWallet.id,
              type: 'credit_fee',
              amount: CREDIT_USAGE_FEE,
              balance_before: balanceAfter,
              balance_after: feeBalanceAfter,
              reference: feeReference,
            },
          });
          await client.payment.create({
            data: {
              rental_order_id: order.id,
              user_id: order.renter_id,
              type: 'credit_fee',
              amount: CREDIT_USAGE_FEE,
              method: 'credit_line',
              status: 'success',
              transaction_ref: feeReference,
              paid_at: new Date(),
            },
          });
        }

        const creditRef = await client.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
          select: { id: true },
        });
        if (!creditRef) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CREDIT',
            message: 'INSUFFICIENT_CREDIT',
          });
        }

        await client.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditRef.id}::uuid FOR UPDATE`;
        const creditWallet = await client.mutuxWallet.findUniqueOrThrow({
          where: { id: creditRef.id },
        });

        const availableCredit = creditWallet.total_limit
          .minus(creditWallet.locked_balance)
          .minus(creditWallet.outstanding_debt);
        const creditUnavailable =
          creditWallet.status !== WalletStatusType.active ||
          (creditWallet.expired_at !== null &&
            creditWallet.expired_at <= new Date());
        if (
          creditUnavailable ||
          availableCredit.lessThan(order.deposit_amount)
        ) {
          throw new BadRequestException({
            error: 'INSUFFICIENT_CREDIT',
            message: 'INSUFFICIENT_CREDIT',
          });
        }

        const creditDisplayBalanceAfter = creditWallet.display_balance.minus(
          order.deposit_amount,
        );
        const creditLockedBalanceAfter = creditWallet.locked_balance.plus(
          order.deposit_amount,
        );

        await client.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            display_balance: creditDisplayBalanceAfter,
            locked_balance: creditLockedBalanceAfter,
          },
        });
        await client.creditTransaction.create({
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

        await this.reconciliation.checkCreditLineBalance(
          client,
          creditWallet.id,
        );
      }

      const escrow = await client.escrowWallet.create({
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

      return this.toResult(escrow);
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  async release(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowResult> {
    const execute = async (client: Prisma.TransactionClient) => {
      await client.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await client.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const escrow = order.escrow_wallet;
      if (!escrow) {
        throw new BadRequestException({
          error: 'ESCROW_NOT_FOUND',
          message: 'No escrow found for this order',
        });
      }

      const existingIncomeTx = await client.lenderWalletTransaction.findFirst({
        where: { rental_order_id: orderId, type: 'income' },
      });
      const existingCompensationTx =
        await client.lenderWalletTransaction.findFirst({
          where: { rental_order_id: orderId, type: 'compensation' },
        });
      if (escrow.status === 'released') {
        if (!existingIncomeTx || existingCompensationTx) {
          throw new BadRequestException({
            error: 'SETTLEMENT_STATE_INCONSISTENT',
            message:
              'Escrow is released without the matching lender income ledger',
          });
        }
        return this.toResult(escrow);
      }
      if (escrow.status !== 'locked') {
        throw new BadRequestException({
          error: 'ESCROW_INVALID_STATUS',
          message: `Escrow status is ${escrow.status}, expected locked`,
        });
      }

      if (existingIncomeTx || existingCompensationTx) {
        throw new BadRequestException({
          error: 'SETTLEMENT_STATE_INCONSISTENT',
          message:
            'A lender settlement ledger exists while escrow is still locked; manual reconciliation is required',
        });
      }

      const lenderIncome =
        order.lender_income.toNumber() > 0
          ? order.lender_income
          : computeLenderIncome(order.rental_fee);

      const lenderWallet = await client.lenderWallet.findUnique({
        where: { lender_id: order.lender_id },
      });
      if (!lenderWallet) {
        throw new BadRequestException({
          error: 'LENDER_WALLET_NOT_FOUND',
          message: 'Lender wallet not found',
        });
      }
      await client.$queryRaw`SELECT id FROM lender_wallets WHERE id = ${lenderWallet.id}::uuid FOR UPDATE`;

      if (escrow.source === 'renter_cash') {
        const renterWallet = await client.renterWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!renterWallet) {
          throw new BadRequestException({
            error: 'RENTER_WALLET_NOT_FOUND',
            message: 'Renter wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${renterWallet.id}::uuid FOR UPDATE`;

        await client.renterWallet.update({
          where: { id: renterWallet.id },
          data: {
            locked_balance: renterWallet.locked_balance.sub(escrow.amount),
          },
        });
      } else {
        const creditWallet = await client.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!creditWallet) {
          throw new BadRequestException({
            error: 'CREDIT_WALLET_NOT_FOUND',
            message: 'Credit wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditWallet.id}::uuid FOR UPDATE`;

        const lockedAfter = creditWallet.locked_balance.sub(escrow.amount);
        const displayAfter = creditWallet.total_limit
          .sub(lockedAfter)
          .sub(creditWallet.outstanding_debt);

        await client.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            locked_balance: lockedAfter,
            display_balance: displayAfter,
          },
        });
        await client.creditTransaction.create({
          data: {
            mutux_wallet_id: creditWallet.id,
            type: 'deposit_release',
            amount: escrow.amount,
            display_balance_before: creditWallet.display_balance,
            display_balance_after: displayAfter,
            direction: 'in',
            ref_type: 'rental_order',
            ref_id: order.id,
            note: `Release deposit for rental order ${order.id}`,
            status: 'success',
          },
        });
      }

      const lenderBalanceAfter = lenderWallet.balance.plus(lenderIncome);

      await client.lenderWallet.update({
        where: { id: lenderWallet.id },
        data: { balance: lenderBalanceAfter },
      });
      await client.lenderWalletTransaction.create({
        data: {
          lender_wallet_id: lenderWallet.id,
          rental_order_id: order.id,
          type: 'income',
          amount: lenderIncome,
          balance_before: lenderWallet.balance,
          balance_after: lenderBalanceAfter,
          note: `Income for order ${order.order_code} (after ${PLATFORM_FEE_RATE * 100}% platform fee)`,
        },
      });

      const now = new Date();
      const updated = await client.escrowWallet.update({
        where: { id: escrow.id },
        data: { status: 'released', released_at: now },
      });

      return this.toResult(updated);
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  async refundLateDelivery(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowResult> {
    const execute = async (client: Prisma.TransactionClient) => {
      await client.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await client.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const escrow = order.escrow_wallet;
      if (!escrow) {
        throw new BadRequestException({
          error: 'ESCROW_NOT_FOUND',
          message: 'No escrow found for this order',
        });
      }

      const reference = `LATE-DELIVERY-REFUND-${orderId}`;
      const existingRefund = await client.renterWalletTransaction.findUnique({
        where: { reference },
      });
      if (escrow.status === 'released' && existingRefund) {
        return this.toResult(escrow);
      }
      if (escrow.status !== 'locked') {
        throw new BadRequestException({
          error: 'ESCROW_INVALID_STATUS',
          message: `Escrow status is ${escrow.status}, expected locked`,
        });
      }
      if (existingRefund) {
        throw new BadRequestException({
          error: 'SETTLEMENT_STATE_INCONSISTENT',
          message: 'Late-delivery refund ledger exists while escrow is locked',
        });
      }

      const renterWallet = await client.renterWallet.findUnique({
        where: { user_id: order.renter_id },
      });
      if (!renterWallet) {
        throw new BadRequestException({
          error: 'RENTER_WALLET_NOT_FOUND',
          message: 'Renter wallet not found',
        });
      }
      await client.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${renterWallet.id}::uuid FOR UPDATE`;
      const balanceAfter = renterWallet.balance.plus(order.rental_fee);

      await client.renterWallet.update({
        where: { id: renterWallet.id },
        data: {
          balance: balanceAfter,
          locked_balance:
            escrow.source === 'renter_cash'
              ? renterWallet.locked_balance.sub(escrow.amount)
              : renterWallet.locked_balance,
        },
      });
      await client.renterWalletTransaction.create({
        data: {
          wallet_id: renterWallet.id,
          type: 'late_delivery_refund',
          amount: order.rental_fee,
          balance_before: renterWallet.balance,
          balance_after: balanceAfter,
          reference,
        },
      });

      if (escrow.source === 'credit_line') {
        const creditWallet = await client.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!creditWallet) {
          throw new BadRequestException({
            error: 'CREDIT_WALLET_NOT_FOUND',
            message: 'Credit wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditWallet.id}::uuid FOR UPDATE`;
        const lockedAfter = creditWallet.locked_balance.sub(escrow.amount);
        const displayAfter = creditWallet.total_limit
          .sub(lockedAfter)
          .sub(creditWallet.outstanding_debt);
        await client.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            locked_balance: lockedAfter,
            display_balance: displayAfter,
          },
        });
        await client.creditTransaction.create({
          data: {
            mutux_wallet_id: creditWallet.id,
            type: 'deposit_release',
            amount: escrow.amount,
            display_balance_before: creditWallet.display_balance,
            display_balance_after: displayAfter,
            direction: 'in',
            ref_type: 'rental_order',
            ref_id: order.id,
            note: `Release deposit after late delivery refund for ${order.id}`,
            status: 'success',
          },
        });
      }

      const updated = await client.escrowWallet.update({
        where: { id: escrow.id },
        data: { status: 'released', released_at: new Date() },
      });
      return this.toResult(updated);
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  async compensateRenter(
    orderId: string,
    compensationAmount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowResult> {
    const execute = async (client: Prisma.TransactionClient) => {
      await client.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await client.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const escrow = order.escrow_wallet;
      if (!escrow) {
        throw new BadRequestException({
          error: 'ESCROW_NOT_FOUND',
          message: 'No escrow found for this order',
        });
      }

      const existingCompensation =
        await client.renterWalletTransaction.findFirst({
          where: {
            reference: `RENTER-COMPENSATION-${orderId}`,
            type: 'renter_compensation',
          },
        });
      if (escrow.status === 'renter_compensated') {
        if (!existingCompensation) {
          throw new BadRequestException({
            error: 'SETTLEMENT_STATE_INCONSISTENT',
            message: 'Renter-compensated escrow is missing its wallet ledger',
          });
        }
        return this.toResult(escrow);
      }
      if (escrow.status !== 'locked') {
        throw new BadRequestException({
          error: 'ESCROW_INVALID_STATUS',
          message: `Escrow status is ${escrow.status}, expected locked`,
        });
      }
      const compensation = new Prisma.Decimal(compensationAmount);
      if (
        compensation.lessThanOrEqualTo(0) ||
        compensation.greaterThan(order.rental_fee)
      ) {
        throw new BadRequestException({
          error: 'COMPENSATION_EXCEEDS_RENTAL_FEE',
          message: `Compensation amount ${compensationAmount} exceeds rental fee ${order.rental_fee.toString()}`,
        });
      }
      if (existingCompensation) {
        throw new BadRequestException({
          error: 'SETTLEMENT_STATE_INCONSISTENT',
          message: 'Renter compensation ledger exists while escrow is locked',
        });
      }

      const renterWallet = await client.renterWallet.findUnique({
        where: { user_id: order.renter_id },
      });
      if (!renterWallet) {
        throw new BadRequestException({
          error: 'RENTER_WALLET_NOT_FOUND',
          message: 'Renter wallet not found',
        });
      }
      await client.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${renterWallet.id}::uuid FOR UPDATE`;

      const renterBalanceAfter = renterWallet.balance.plus(compensation);
      await client.renterWallet.update({
        where: { id: renterWallet.id },
        data: {
          balance: renterBalanceAfter,
          locked_balance:
            escrow.source === 'renter_cash'
              ? renterWallet.locked_balance.sub(escrow.amount)
              : renterWallet.locked_balance,
        },
      });
      await client.renterWalletTransaction.create({
        data: {
          wallet_id: renterWallet.id,
          type: 'renter_compensation',
          amount: compensation,
          balance_before: renterWallet.balance,
          balance_after: renterBalanceAfter,
          reference: `RENTER-COMPENSATION-${orderId}`,
        },
      });

      if (escrow.source === 'credit_line') {
        const creditWallet = await client.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!creditWallet) {
          throw new BadRequestException({
            error: 'CREDIT_WALLET_NOT_FOUND',
            message: 'Credit wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditWallet.id}::uuid FOR UPDATE`;
        const lockedAfter = creditWallet.locked_balance.sub(escrow.amount);
        const displayAfter = creditWallet.total_limit
          .sub(lockedAfter)
          .sub(creditWallet.outstanding_debt);
        await client.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            locked_balance: lockedAfter,
            display_balance: displayAfter,
          },
        });
        await client.creditTransaction.create({
          data: {
            mutux_wallet_id: creditWallet.id,
            type: 'deposit_release',
            amount: escrow.amount,
            display_balance_before: creditWallet.display_balance,
            display_balance_after: displayAfter,
            direction: 'in',
            ref_type: 'dispute',
            ref_id: order.id,
            note: `Release deposit after renter compensation for ${order.id}`,
            status: 'success',
          },
        });
      }

      const updated = await client.escrowWallet.update({
        where: { id: escrow.id },
        data: { status: 'renter_compensated', released_at: new Date() },
      });
      return this.toResult(updated);
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  async compensate(
    orderId: string,
    deductAmount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<EscrowResult> {
    const execute = async (client: Prisma.TransactionClient) => {
      await client.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await client.rentalOrder.findUnique({
        where: { id: orderId },
        include: { escrow_wallet: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const escrow = order.escrow_wallet;
      if (!escrow) {
        throw new BadRequestException({
          error: 'ESCROW_NOT_FOUND',
          message: 'No escrow found for this order',
        });
      }

      const existingIncomeTx = await client.lenderWalletTransaction.findFirst({
        where: { rental_order_id: orderId, type: 'income' },
      });
      const existingCompensationTx =
        await client.lenderWalletTransaction.findFirst({
          where: { rental_order_id: orderId, type: 'compensation' },
        });
      if (escrow.status === 'compensated') {
        if (!existingIncomeTx || !existingCompensationTx) {
          throw new BadRequestException({
            error: 'SETTLEMENT_STATE_INCONSISTENT',
            message:
              'Compensated escrow is missing an income or compensation ledger',
          });
        }
        return this.toResult(escrow);
      }
      if (escrow.status !== 'locked') {
        throw new BadRequestException({
          error: 'ESCROW_INVALID_STATUS',
          message: `Escrow status is ${escrow.status}, expected locked`,
        });
      }

      const deduct = new Prisma.Decimal(deductAmount);
      if (deduct.greaterThan(escrow.amount)) {
        throw new BadRequestException({
          error: 'DEDUCT_EXCEEDS_DEPOSIT',
          message: `Deduct amount ${deductAmount} exceeds deposit ${escrow.amount.toString()}`,
        });
      }

      if (existingIncomeTx || existingCompensationTx) {
        throw new BadRequestException({
          error: 'SETTLEMENT_STATE_INCONSISTENT',
          message:
            'A lender settlement ledger exists while escrow is still locked; manual reconciliation is required',
        });
      }

      const lenderIncome =
        order.lender_income.toNumber() > 0
          ? order.lender_income
          : computeLenderIncome(order.rental_fee);

      const lenderWallet = await client.lenderWallet.findUnique({
        where: { lender_id: order.lender_id },
      });
      if (!lenderWallet) {
        throw new BadRequestException({
          error: 'LENDER_WALLET_NOT_FOUND',
          message: 'Lender wallet not found',
        });
      }
      await client.$queryRaw`SELECT id FROM lender_wallets WHERE id = ${lenderWallet.id}::uuid FOR UPDATE`;

      if (escrow.source === 'renter_cash') {
        const renterWallet = await client.renterWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!renterWallet) {
          throw new BadRequestException({
            error: 'RENTER_WALLET_NOT_FOUND',
            message: 'Renter wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${renterWallet.id}::uuid FOR UPDATE`;

        await client.renterWallet.update({
          where: { id: renterWallet.id },
          data: {
            balance: renterWallet.balance.sub(deduct),
            locked_balance: renterWallet.locked_balance.sub(escrow.amount),
          },
        });

        if (deduct.greaterThan(0)) {
          await client.renterWalletTransaction.create({
            data: {
              wallet_id: renterWallet.id,
              type: 'compensation',
              amount: deduct,
              balance_before: renterWallet.balance,
              balance_after: renterWallet.balance.sub(deduct),
              reference: `COMPENSATION-${orderId}`,
            },
          });
        }
      } else {
        const creditWallet = await client.mutuxWallet.findUnique({
          where: { user_id: order.renter_id },
        });
        if (!creditWallet) {
          throw new BadRequestException({
            error: 'CREDIT_WALLET_NOT_FOUND',
            message: 'Credit wallet not found',
          });
        }
        await client.$queryRaw`SELECT id FROM mutux_wallets WHERE id = ${creditWallet.id}::uuid FOR UPDATE`;

        const lockedAfter = creditWallet.locked_balance.sub(escrow.amount);
        const debtAfter = creditWallet.outstanding_debt.plus(deduct);
        const displayAfter = creditWallet.total_limit
          .sub(lockedAfter)
          .sub(debtAfter);

        await client.mutuxWallet.update({
          where: { id: creditWallet.id },
          data: {
            locked_balance: lockedAfter,
            outstanding_debt: debtAfter,
            display_balance: displayAfter,
          },
        });
        await client.creditTransaction.create({
          data: {
            mutux_wallet_id: creditWallet.id,
            type: 'compensation',
            amount: deduct,
            display_balance_before: creditWallet.display_balance,
            display_balance_after: displayAfter,
            direction: 'out',
            ref_type: 'dispute',
            ref_id: order.id,
            note: `Compensation for rental order ${order.id}`,
            status: 'success',
          },
        });
      }

      const totalLenderAmount = lenderIncome.plus(deduct);
      const lenderBalanceAfter = lenderWallet.balance.plus(totalLenderAmount);

      await client.lenderWallet.update({
        where: { id: lenderWallet.id },
        data: { balance: lenderBalanceAfter },
      });

      await client.lenderWalletTransaction.create({
        data: {
          lender_wallet_id: lenderWallet.id,
          rental_order_id: order.id,
          type: 'income',
          amount: lenderIncome,
          balance_before: lenderWallet.balance,
          balance_after: lenderWallet.balance.plus(lenderIncome),
          note: `Income for order ${order.order_code}`,
        },
      });

      if (deduct.greaterThan(0)) {
        await client.lenderWalletTransaction.create({
          data: {
            lender_wallet_id: lenderWallet.id,
            rental_order_id: order.id,
            type: 'compensation',
            amount: deduct,
            balance_before: lenderWallet.balance.plus(lenderIncome),
            balance_after: lenderBalanceAfter,
            note: `Compensation for order ${order.order_code}`,
          },
        });
      }

      const updated = await client.escrowWallet.update({
        where: { id: escrow.id },
        data: { status: 'compensated' },
      });

      return this.toResult(updated);
    };

    return tx ? execute(tx) : this.prisma.$transaction(execute);
  }

  private toResult(escrow: {
    id: string;
    rental_order_id: string;
    amount: Prisma.Decimal;
    source: 'renter_cash' | 'credit_line';
    status:
      | 'locked'
      | 'pending_return'
      | 'released'
      | 'compensated'
      | 'renter_compensated';
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
