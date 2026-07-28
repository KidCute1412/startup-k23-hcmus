/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import {
  DepositTypeEnum,
  DisputeReasonEnum,
  OrderStatusType,
  ReporterRoleEnum,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createFixtureIds,
  createAccessTokenCookie,
  createIntegrationApp,
  createJwt,
  INTEGRATION_FRONTEND_ORIGIN,
} from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration(
  'Admin Dispute Settlement & Transaction Atomicity (PostgreSQL integration)',
  () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let adminId: string;
    let lenderId: string;
    let renterId: string;
    let gearId: string;
    let adminToken: string;
    let lenderWalletId: string;
    let renterWalletId: string;

    const { ids: fixtureIds, newId } = createFixtureIds();

    beforeAll(async () => {
      process.env.DATABASE_URL = testDatabaseUrl;
      process.env.JWT_SECRET =
        process.env.JWT_SECRET || 'dispute-integration-test-secret';
      ({ app, prisma } = await createIntegrationApp());

      adminId = newId();
      lenderId = newId();
      renterId = newId();
      gearId = newId();

      await prisma.user.createMany({
        data: [
          {
            id: adminId,
            email: `admin-dispute-${adminId}@integration.test`,
            password_hash: 'x',
            role: 'admin',
            kyc_status: 'verified',
          },
          {
            id: lenderId,
            email: `lender-dispute-${lenderId}@integration.test`,
            password_hash: 'x',
            role: 'lender',
            kyc_status: 'verified',
          },
          {
            id: renterId,
            email: `renter-dispute-${renterId}@integration.test`,
            password_hash: 'x',
            role: 'renter',
            kyc_status: 'verified',
          },
        ],
      });

      const lenderWallet = await prisma.lenderWallet.create({
        data: {
          lender_id: lenderId,
          balance: 0,
          total_withdrawn: 0,
        },
      });
      lenderWalletId = lenderWallet.id;

      const renterWallet = await prisma.renterWallet.create({
        data: {
          user_id: renterId,
          balance: 1000000,
          locked_balance: 0,
        },
      });
      renterWalletId = renterWallet.id;

      await prisma.gear.create({
        data: {
          id: gearId,
          lender_id: lenderId,
          name: 'Dispute test gear',
          rent_price_per_day: 100000,
          approval_status: 'approved',
          status: 'available',
        },
      });

      adminToken = createJwt(adminId, 'admin');
    });

    async function createDisputedTraditionalOrderFixture(
      depositAmount = 400000,
    ) {
      const orderId = newId();
      const disputeId = newId();

      const order = await prisma.rentalOrder.create({
        data: {
          id: orderId,
          order_code: `DISP-TRAD-${orderId.substring(0, 8)}`,
          renter_id: renterId,
          lender_id: lenderId,
          gear_id: gearId,
          start_date: new Date('2026-09-01T00:00:00.000Z'),
          end_date: new Date('2026-09-02T00:00:00.000Z'),
          duration_days: 1,
          snapped_rent_price_per_day: 100000,
          rental_fee: 100000,
          base_rental_fee: 100000,
          deposit_amount: depositAmount,
          lender_income: 85000,
          deposit_type: DepositTypeEnum.traditional,
          status: OrderStatusType.disputed,
        },
      });

      await prisma.renterWallet.update({
        where: { id: renterWalletId },
        data: { locked_balance: { increment: depositAmount } },
      });

      await prisma.escrowWallet.create({
        data: {
          rental_order_id: orderId,
          amount: depositAmount,
          source: 'renter_cash',
          status: 'locked',
        },
      });

      const dispute = await prisma.dispute.create({
        data: {
          id: disputeId,
          rental_order_id: orderId,
          reported_by: renterId,
          reporter_role: ReporterRoleEnum.renter,
          reason: DisputeReasonEnum.device_damaged,
          description: 'Scratched surface',
          status: 'open',
        },
      });

      return { order, dispute };
    }

    async function createDisputedCreditLineOrderFixture(
      depositAmount = 400000,
    ) {
      const orderId = newId();
      const disputeId = newId();

      const creditWallet = await prisma.mutuxWallet.create({
        data: {
          id: newId(),
          user_id: renterId,
          total_limit: 1000000,
          display_balance: 600000,
          locked_balance: depositAmount,
          outstanding_debt: 0,
          status: 'active',
        },
      });

      const order = await prisma.rentalOrder.create({
        data: {
          id: orderId,
          order_code: `DISP-CRED-${orderId.substring(0, 8)}`,
          renter_id: renterId,
          lender_id: lenderId,
          gear_id: gearId,
          start_date: new Date('2026-09-01T00:00:00.000Z'),
          end_date: new Date('2026-09-02T00:00:00.000Z'),
          duration_days: 1,
          snapped_rent_price_per_day: 100000,
          rental_fee: 100000,
          base_rental_fee: 100000,
          deposit_amount: depositAmount,
          lender_income: 85000,
          deposit_type: DepositTypeEnum.credit_line,
          status: OrderStatusType.disputed,
        },
      });

      await prisma.escrowWallet.create({
        data: {
          rental_order_id: orderId,
          amount: depositAmount,
          source: 'credit_line',
          status: 'locked',
        },
      });

      const dispute = await prisma.dispute.create({
        data: {
          id: disputeId,
          rental_order_id: orderId,
          reported_by: renterId,
          reporter_role: ReporterRoleEnum.renter,
          reason: DisputeReasonEnum.device_damaged,
          description: 'Faulty port',
          status: 'open',
        },
      });

      return { order, dispute, creditWallet };
    }

    it('refund resolution unlocks traditional deposit and pays lender income', async () => {
      const { order, dispute } =
        await createDisputedTraditionalOrderFixture(400000);
      const initialLenderWallet = await prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      });
      const initialRenterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'refund',
          resolutionNote: 'Full refund agreed',
        })
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: dispute.id,
        status: 'resolved',
        resolutionType: 'refund',
        deductAmount: null,
        resolvedBy: adminId,
      });

      const updatedDispute = await prisma.dispute.findUniqueOrThrow({
        where: { id: dispute.id },
      });
      expect(updatedDispute.status).toBe('resolved');

      const updatedOrder = await prisma.rentalOrder.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatusType.completed);

      const escrow = await prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      });
      expect(escrow.status).toBe('released');

      const renterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });
      expect(renterWallet.locked_balance.toNumber()).toBe(
        initialRenterWallet.locked_balance.toNumber() - 400000,
      );

      const lenderWallet = await prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      });
      expect(lenderWallet.balance.toNumber()).toBe(
        initialLenderWallet.balance.toNumber() + 85000,
      );
    });

    it('deposit_deduct resolution deducts renter cash, pays lender income + deduction, and unlocks remaining deposit', async () => {
      const deductAmount = 150000;
      const { order, dispute } =
        await createDisputedTraditionalOrderFixture(400000);
      const initialLenderWallet = await prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      });
      const initialRenterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'deposit_deduct',
          deductAmount,
          resolutionNote: 'Deducted for crack',
        })
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: dispute.id,
        status: 'resolved',
        resolutionType: 'deposit_deduct',
        deductAmount,
      });

      const escrow = await prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      });
      expect(escrow.status).toBe('compensated');

      const renterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });
      expect(renterWallet.balance.toNumber()).toBe(
        initialRenterWallet.balance.toNumber() - deductAmount,
      );
      expect(renterWallet.locked_balance.toNumber()).toBe(
        initialRenterWallet.locked_balance.toNumber() - 400000,
      );

      const lenderWallet = await prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      });
      expect(lenderWallet.balance.toNumber()).toBe(
        initialLenderWallet.balance.toNumber() + 85000 + deductAmount,
      );

      const lenderTx = await prisma.lenderWalletTransaction.findFirst({
        where: { rental_order_id: order.id, type: 'compensation' },
      });
      expect(lenderTx).not.toBeNull();
      expect(lenderTx?.amount.toNumber()).toBe(deductAmount);
    });

    it('deposit_deduct resolution for credit-line increases outstanding_debt and recalculates display_balance accurately', async () => {
      const deductAmount = 150000;
      const { dispute, creditWallet } =
        await createDisputedCreditLineOrderFixture(400000);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'deposit_deduct',
          deductAmount,
          resolutionNote: 'Credit line deduction',
        })
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: dispute.id,
        status: 'resolved',
        resolutionType: 'deposit_deduct',
        deductAmount,
      });

      const updatedCreditWallet = await prisma.mutuxWallet.findUniqueOrThrow({
        where: { id: creditWallet.id },
      });
      expect(updatedCreditWallet.outstanding_debt.toNumber()).toBe(150000);
      expect(updatedCreditWallet.locked_balance.toNumber()).toBe(0);
      // total_limit (1,000,000) - locked_balance (0) - outstanding_debt (150,000) = 850,000
      expect(updatedCreditWallet.display_balance.toNumber()).toBe(850000);

      const creditTx = await prisma.creditTransaction.findFirst({
        where: { mutux_wallet_id: creditWallet.id, type: 'compensation' },
      });
      expect(creditTx).not.toBeNull();
      expect(creditTx?.amount.toNumber()).toBe(deductAmount);
      expect(creditTx?.display_balance_after.toNumber()).toBe(850000);
    });

    it('rolls back dispute status and wallets when deductAmount exceeds deposit amount', async () => {
      const { order, dispute } =
        await createDisputedTraditionalOrderFixture(400000);
      const initialRenterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'deposit_deduct',
          deductAmount: 500000, // Exceeds deposit 400000
          resolutionNote: 'Excessive deduction attempt',
        })
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        error: { code: 'DEDUCT_EXCEEDS_DEPOSIT' },
      });

      // Dispute record MUST NOT be updated
      const unupdatedDispute = await prisma.dispute.findUniqueOrThrow({
        where: { id: dispute.id },
      });
      expect(unupdatedDispute.status).toBe('open');

      // Rental order MUST NOT be updated
      const unupdatedOrder = await prisma.rentalOrder.findUniqueOrThrow({
        where: { id: order.id },
      });
      expect(unupdatedOrder.status).toBe(OrderStatusType.disputed);

      // Wallets MUST remain unchanged
      const renterWallet = await prisma.renterWallet.findUniqueOrThrow({
        where: { id: renterWalletId },
      });
      expect(renterWallet.balance.toNumber()).toBe(
        initialRenterWallet.balance.toNumber(),
      );
      expect(renterWallet.locked_balance.toNumber()).toBe(
        initialRenterWallet.locked_balance.toNumber(),
      );
    });

    it('guarantees idempotency when resolve is called twice (EscrowService NOT called second time)', async () => {
      const { dispute } = await createDisputedTraditionalOrderFixture(400000);

      // First resolve
      const firstRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'refund',
          resolutionNote: 'First resolve',
        })
        .expect(200);

      expect(firstRes.body.data.status).toBe('resolved');

      const lenderWalletAfterFirst =
        await prisma.lenderWallet.findUniqueOrThrow({
          where: { id: lenderWalletId },
        });

      // Second resolve call on same dispute
      const secondRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
        .set('Cookie', createAccessTokenCookie(adminToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          resolutionType: 'refund',
          resolutionNote: 'Second resolve attempt',
        })
        .expect(200);

      expect(secondRes.body.data).toMatchObject({
        id: dispute.id,
        status: 'resolved',
      });

      // Lender wallet balance MUST NOT have been credited a second time
      const lenderWalletAfterSecond =
        await prisma.lenderWallet.findUniqueOrThrow({
          where: { id: lenderWalletId },
        });
      expect(lenderWalletAfterSecond.balance.toNumber()).toBe(
        lenderWalletAfterFirst.balance.toNumber(),
      );
    });

    it('handles concurrent resolve requests safely with row lock', async () => {
      const { dispute } = await createDisputedTraditionalOrderFixture(400000);

      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
          .set('Cookie', createAccessTokenCookie(adminToken))
          .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
          .send({
            resolutionType: 'refund',
            resolutionNote: 'Concurrent 1',
          }),
        request(app.getHttpServer())
          .post(`/api/v1/admin/disputes/${dispute.id}/resolve`)
          .set('Cookie', createAccessTokenCookie(adminToken))
          .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
          .send({
            resolutionType: 'refund',
            resolutionNote: 'Concurrent 2',
          }),
      ]);

      expect([201, 200]).toContain(res1.status);
      expect([201, 200]).toContain(res2.status);
      expect(res1.body.data.status).toBe('resolved');
      expect(res2.body.data.status).toBe('resolved');

      const disputeRecord = await prisma.dispute.findUniqueOrThrow({
        where: { id: dispute.id },
      });
      expect(disputeRecord.status).toBe('resolved');
    });

    afterAll(async () => {
      if (prisma) {
        await prisma.dispute.deleteMany({ where: { id: { in: fixtureIds } } });
        await prisma.escrowWallet.deleteMany({
          where: { rental_order_id: { in: fixtureIds } },
        });
        await prisma.rentalOrder.deleteMany({
          where: { id: { in: fixtureIds } },
        });
        await prisma.creditTransaction.deleteMany({
          where: { ref_id: { in: fixtureIds } },
        });
        await prisma.mutuxWallet.deleteMany({
          where: { id: { in: fixtureIds } },
        });
        await prisma.renterWalletTransaction.deleteMany({
          where: { wallet_id: renterWalletId },
        });
        await prisma.lenderWalletTransaction.deleteMany({
          where: { lender_wallet_id: lenderWalletId },
        });
        await prisma.renterWallet.deleteMany({ where: { id: renterWalletId } });
        await prisma.lenderWallet.deleteMany({ where: { id: lenderWalletId } });
        await prisma.gear.deleteMany({ where: { id: { in: fixtureIds } } });
        await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
      }
      await app?.close();
    });
  },
);
