import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type RentalOrder } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const PLATFORM_WALLET_ID = 1;
const CONFIG_ID = 1;

@Injectable()
export class PlatformFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private fee(amount: Prisma.Decimal, rateBps: number) {
    // VND is settled as whole dong. The platform never receives more than the advertised rate.
    return amount.mul(rateBps).div(10_000).floor();
  }

  async getConfig() {
    return this.prisma.platformFeeConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, platform_fee_rate_bps: 3000 },
      update: {},
    });
  }

  async updateRate(adminId: string, rateBps: number) {
    if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) {
      throw new BadRequestException({
        error: 'INVALID_PLATFORM_FEE_RATE',
        message: 'platformFeeRateBps must be an integer between 0 and 10000',
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const config = await tx.platformFeeConfig.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, platform_fee_rate_bps: 3000 },
        update: {},
      });
      if (config.platform_fee_rate_bps !== rateBps) {
        await tx.platformFeeConfig.update({
          where: { id: CONFIG_ID },
          data: { platform_fee_rate_bps: rateBps, updated_by: adminId },
        });
        await tx.platformFeeConfigAudit.create({
          data: {
            previous_rate_bps: config.platform_fee_rate_bps,
            next_rate_bps: rateBps,
            changed_by: adminId,
          },
        });
      }
      return {
        platformFeeRateBps: rateBps,
        platformFeeRatePercent: rateBps / 100,
      };
    });
  }

  async holdRentalFee(order: RentalOrder, tx: Prisma.TransactionClient) {
    const exists = await tx.rentalFeeSettlement.findUnique({
      where: { rental_order_id: order.id },
    });
    if (exists) return exists;
    const config = await tx.platformFeeConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID, platform_fee_rate_bps: 3000 },
      update: {},
    });
    const rateBps = config.platform_fee_rate_bps;
    const expectedFee = this.fee(order.rental_fee, rateBps);
    const expectedLenderIncome = order.rental_fee.sub(expectedFee);
    await tx.platformWallet.upsert({
      where: { id: PLATFORM_WALLET_ID },
      create: { id: PLATFORM_WALLET_ID, rental_hold_balance: order.rental_fee },
      update: { rental_hold_balance: { increment: order.rental_fee } },
    });
    await tx.platformLedgerTransaction.create({
      data: {
        platform_wallet_id: PLATFORM_WALLET_ID,
        rental_order_id: order.id,
        type: 'rental_hold',
        amount: order.rental_fee,
        reference: `RENTAL-HOLD-${order.id}`,
        note: `Hold rental fee for ${order.order_code}`,
      },
    });
    await tx.rentalOrder.update({
      where: { id: order.id },
      data: {
        platform_fee_rate_bps: rateBps,
        platform_fee: expectedFee,
        lender_income: expectedLenderIncome,
      },
    });
    return tx.rentalFeeSettlement.create({
      data: {
        rental_order_id: order.id,
        gross_rental_fee: order.rental_fee,
        platform_fee_rate_bps: rateBps,
      },
    });
  }

  async settleRentalFee(
    orderId: string,
    rentalRefundAmount: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ) {
    const order = await tx.rentalOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    const settlement = await tx.rentalFeeSettlement.findUnique({
      where: { rental_order_id: orderId },
    });
    if (!settlement)
      throw new BadRequestException({
        error: 'RENTAL_SETTLEMENT_NOT_FOUND',
        message: 'Rental fee was not held for this order',
      });
    if (settlement.status !== 'held') return settlement;
    if (
      rentalRefundAmount.lessThan(0) ||
      rentalRefundAmount.greaterThan(settlement.gross_rental_fee)
    )
      throw new BadRequestException({
        error: 'RENTAL_REFUND_EXCEEDS_FEE',
        message: 'Rental refund must be between zero and the rental fee',
      });
    await tx.$queryRaw`SELECT id FROM platform_wallets WHERE id = ${PLATFORM_WALLET_ID} FOR UPDATE`;
    const wallet = await tx.platformWallet.findUniqueOrThrow({
      where: { id: PLATFORM_WALLET_ID },
    });
    const distributable = settlement.gross_rental_fee.sub(rentalRefundAmount);
    const platformFee = this.fee(
      distributable,
      settlement.platform_fee_rate_bps,
    );
    const lenderIncome = distributable.sub(platformFee);
    if (wallet.rental_hold_balance.lessThan(settlement.gross_rental_fee))
      throw new BadRequestException({
        error: 'PLATFORM_HOLD_INCONSISTENT',
        message: 'Platform rental hold is insufficient for settlement',
      });
    const lenderWallet = await tx.lenderWallet.findUniqueOrThrow({
      where: { lender_id: order.lender_id },
    });
    await tx.$queryRaw`SELECT id FROM lender_wallets WHERE id = ${lenderWallet.id}::uuid FOR UPDATE`;
    if (rentalRefundAmount.greaterThan(0)) {
      const renterWallet = await tx.renterWallet.findUniqueOrThrow({
        where: { user_id: order.renter_id },
      });
      await tx.$queryRaw`SELECT id FROM renter_wallets WHERE id = ${renterWallet.id}::uuid FOR UPDATE`;
      const after = renterWallet.balance.plus(rentalRefundAmount);
      await tx.renterWallet.update({
        where: { id: renterWallet.id },
        data: { balance: after },
      });
      await tx.renterWalletTransaction.create({
        data: {
          wallet_id: renterWallet.id,
          type: 'rental_refund',
          amount: rentalRefundAmount,
          balance_before: renterWallet.balance,
          balance_after: after,
          reference: `RENTAL-REFUND-${orderId}`,
        },
      });
      await tx.platformLedgerTransaction.create({
        data: {
          platform_wallet_id: PLATFORM_WALLET_ID,
          rental_order_id: orderId,
          type: 'rental_refund',
          amount: rentalRefundAmount,
          reference: `PLATFORM-RENTAL-REFUND-${orderId}`,
          note: `Rental refund for ${order.order_code}`,
        },
      });
    }
    if (platformFee.greaterThan(0))
      await tx.platformLedgerTransaction.create({
        data: {
          platform_wallet_id: PLATFORM_WALLET_ID,
          rental_order_id: orderId,
          type: 'platform_revenue',
          amount: platformFee,
          reference: `PLATFORM-REVENUE-${orderId}`,
          note: `Platform fee for ${order.order_code}`,
        },
      });
    if (lenderIncome.greaterThan(0)) {
      const lenderAfter = lenderWallet.balance.plus(lenderIncome);
      await tx.lenderWallet.update({
        where: { id: lenderWallet.id },
        data: { balance: lenderAfter },
      });
      await tx.lenderWalletTransaction.create({
        data: {
          lender_wallet_id: lenderWallet.id,
          rental_order_id: orderId,
          type: 'income',
          amount: lenderIncome,
          balance_before: lenderWallet.balance,
          balance_after: lenderAfter,
          note: `Rental income for ${order.order_code} after ${settlement.platform_fee_rate_bps / 100}% platform fee`,
        },
      });
      await tx.platformLedgerTransaction.create({
        data: {
          platform_wallet_id: PLATFORM_WALLET_ID,
          rental_order_id: orderId,
          type: 'lender_payable',
          amount: lenderIncome,
          reference: `LENDER-PAYABLE-${orderId}`,
          note: `Lender income payable for ${order.order_code}`,
        },
      });
    }
    await tx.platformWallet.update({
      where: { id: PLATFORM_WALLET_ID },
      data: {
        rental_hold_balance: wallet.rental_hold_balance.sub(
          settlement.gross_rental_fee,
        ),
        revenue_available_balance:
          wallet.revenue_available_balance.plus(platformFee),
        lender_payable_balance:
          wallet.lender_payable_balance.plus(lenderIncome),
      },
    });
    return tx.rentalFeeSettlement.update({
      where: { rental_order_id: orderId },
      data: {
        rental_refund_amount: rentalRefundAmount,
        distributable_amount: distributable,
        platform_fee_amount: platformFee,
        lender_income_amount: lenderIncome,
        status: rentalRefundAmount.equals(settlement.gross_rental_fee)
          ? 'refunded'
          : 'settled',
        settled_at: new Date(),
      },
    });
  }

  async recordLenderWithdrawal(
    amount: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ) {
    await tx.$queryRaw`SELECT id FROM platform_wallets WHERE id = ${PLATFORM_WALLET_ID} FOR UPDATE`;
    const wallet = await tx.platformWallet.findUniqueOrThrow({
      where: { id: PLATFORM_WALLET_ID },
    });
    if (wallet.lender_payable_balance.lessThan(amount))
      throw new BadRequestException({
        error: 'PLATFORM_PAYABLE_INCONSISTENT',
        message: 'Lender payable balance is insufficient',
      });
    await tx.platformWallet.update({
      where: { id: PLATFORM_WALLET_ID },
      data: {
        lender_payable_balance: wallet.lender_payable_balance.sub(amount),
      },
    });
    await tx.platformLedgerTransaction.create({
      data: {
        platform_wallet_id: PLATFORM_WALLET_ID,
        type: 'lender_withdrawal',
        amount,
        reference: `LENDER-WITHDRAWAL-${Date.now()}-${Math.random()}`,
        note: 'Demo lender withdrawal',
      },
    });
  }
}
