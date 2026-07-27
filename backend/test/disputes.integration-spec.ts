import type { INestApplication } from '@nestjs/common';
import {
  DisputeReasonEnum,
  DisputeStatusType,
  OrderStatusType,
  Prisma,
} from '@prisma/client';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { App } from 'supertest/types';
import { AdminService } from '../src/modules/admin/admin.service';
import { ResolutionType } from '../src/modules/admin/dto/resolve-dispute.dto';
import { DisputeEvidenceMediaType } from '../src/modules/disputes/dto/create-dispute.dto';
import { DisputesService } from '../src/modules/disputes/disputes.service';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createFixtureIds, createIntegrationApp } from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Dispute workflow (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let disputesService: DisputesService;
  let adminService: AdminService;
  let escrowService: EscrowService;
  let renterId: string;
  let lenderId: string;
  let adminId: string;
  let gearId: string;
  let uploadsRoot: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'disputes-integration-test-secret';
    uploadsRoot = mkdtempSync(join(tmpdir(), 'mutux-disputes-integration-'));
    process.env.UPLOADS_DIR = uploadsRoot;
    ({ app, prisma } = await createIntegrationApp());
    disputesService = app.get(DisputesService);
    adminService = app.get(AdminService);
    escrowService = app.get(EscrowService);

    renterId = newId();
    lenderId = newId();
    adminId = newId();
    gearId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: renterId,
          email: `dispute-renter-${renterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
        {
          id: lenderId,
          email: `dispute-lender-${lenderId}@integration.test`,
          password_hash: 'x',
          role: 'lender',
          kyc_status: 'verified',
        },
        {
          id: adminId,
          email: `dispute-admin-${adminId}@integration.test`,
          password_hash: 'x',
          role: 'admin',
          kyc_status: 'verified',
        },
      ],
    });
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Dispute integration gear',
        rent_price_per_day: 100_000,
        value: 400_000,
        approval_status: 'approved',
      },
    });
    await prisma.renterWallet.create({
      data: { user_id: renterId, balance: 2_000_000 },
    });
    await prisma.lenderWallet.create({
      data: { lender_id: lenderId, balance: 0 },
    });
    mkdirSync(join(uploadsRoot, renterId), { recursive: true });
    writeFileSync(join(uploadsRoot, renterId, 'evidence.jpg'), 'image');
  });

  async function createOrder(status: OrderStatusType) {
    const id = newId();
    return prisma.rentalOrder.create({
      data: {
        id,
        order_code: `DISPUTE-${id}`,
        renter_id: renterId,
        lender_id: lenderId,
        gear_id: gearId,
        start_date: new Date('2026-09-01T00:00:00.000Z'),
        end_date: new Date('2026-09-02T00:00:00.000Z'),
        duration_days: 2,
        snapped_rent_price_per_day: 50_000,
        rental_fee: 100_000,
        base_rental_fee: 100_000,
        deposit_amount: 400_000,
        deposit_type: 'traditional',
        status,
      },
    });
  }

  async function createLockedDisputedOrder() {
    const order = await createOrder(OrderStatusType.pending_confirm);
    await escrowService.lock(order.id);
    await prisma.rentalOrder.update({
      where: { id: order.id },
      data: { status: OrderStatusType.disputed },
    });
    const dispute = await prisma.dispute.create({
      data: {
        rental_order_id: order.id,
        reported_by: renterId,
        reporter_role: 'renter',
        reason: DisputeReasonEnum.device_damaged,
      },
    });
    return { order, dispute };
  }

  it('serializes concurrent submissions into one creation and one conflict', async () => {
    const order = await createOrder(OrderStatusType.active);
    const request = {
      rentalOrderId: order.id,
      reason: DisputeReasonEnum.device_damaged,
      evidences: [
        {
          mediaType: DisputeEvidenceMediaType.image,
          url: `/uploads/${renterId}/evidence.jpg`,
        },
      ],
    };

    const results = await Promise.allSettled([
      disputesService.create(renterId, request),
      disputesService.create(renterId, request),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(rejected?.reason).toMatchObject({
      status: 409,
      response: { error: 'DISPUTE_ALREADY_OPEN' },
    });
    expect(
      await prisma.dispute.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(1);
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: OrderStatusType.disputed });
  });

  it.each([
    [ResolutionType.refund, undefined, 'released', null],
    [
      ResolutionType.deposit_deduct,
      100_000,
      'compensated',
      new Prisma.Decimal(100_000),
    ],
  ] as const)(
    'resolves %s atomically and repeated resolution has no financial side effects',
    async (resolutionType, deductAmount, escrowStatus, storedDeductAmount) => {
      const { order, dispute } = await createLockedDisputedOrder();
      const before = await snapshotFinancialState(order.id);

      const first = await adminService.resolveDispute(
        dispute.id,
        adminId,
        resolutionType,
        deductAmount,
        'Integration resolution',
      );
      const afterFirst = await snapshotFinancialState(order.id);
      const second = await adminService.resolveDispute(
        dispute.id,
        newId(),
        resolutionType,
        deductAmount,
        'Must not overwrite',
      );
      const afterSecond = await snapshotFinancialState(order.id);

      expect(second).toEqual(first);
      expect(afterSecond).toEqual(afterFirst);
      expect(afterFirst).not.toEqual(before);
      expect(afterFirst.orderStatus).toBe(OrderStatusType.completed);
      expect(afterFirst.escrowStatus).toBe(escrowStatus);
      await expect(
        prisma.dispute.findUniqueOrThrow({ where: { id: dispute.id } }),
      ).resolves.toMatchObject({
        status: DisputeStatusType.resolved,
        resolved_by: adminId,
        resolution_type: resolutionType,
        deduct_amount: storedDeductAmount,
      });
    },
  );

  async function snapshotFinancialState(orderId: string) {
    const [
      order,
      escrow,
      renterWallet,
      lenderWallet,
      renterLedgerCount,
      lenderLedgerCount,
      creditLedgerCount,
    ] = await Promise.all([
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: orderId } }),
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: orderId },
      }),
      prisma.renterWallet.findUniqueOrThrow({
        where: { user_id: renterId },
      }),
      prisma.lenderWallet.findUniqueOrThrow({
        where: { lender_id: lenderId },
      }),
      prisma.renterWalletTransaction.count(),
      prisma.lenderWalletTransaction.count(),
      prisma.creditTransaction.count(),
    ]);
    return {
      orderStatus: order.status,
      escrowStatus: escrow.status,
      renterBalance: renterWallet.balance.toString(),
      renterLockedBalance: renterWallet.locked_balance.toString(),
      lenderBalance: lenderWallet.balance.toString(),
      renterLedgerCount,
      lenderLedgerCount,
      creditLedgerCount,
    };
  }

  afterAll(async () => {
    if (prisma) {
      await prisma.rentalOrder.deleteMany({
        where: { id: { in: fixtureIds } },
      });
      await prisma.gear.deleteMany({ where: { id: { in: fixtureIds } } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    }
    await app?.close();
    rmSync(uploadsRoot, { recursive: true, force: true });
    delete process.env.UPLOADS_DIR;
  });
});
