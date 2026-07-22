import type { INestApplication } from '@nestjs/common';
import { DepositTypeEnum, OrderStatusType, Prisma } from '@prisma/client';
import { App } from 'supertest/types';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createFixtureIds, createIntegrationApp } from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('EscrowService.lock (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let escrowService: EscrowService;
  let lenderId: string;
  let gearId: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'escrow-integration-test-secret';
    ({ app, prisma } = await createIntegrationApp());
    escrowService = app.get(EscrowService);

    lenderId = newId();
    gearId = newId();
    await prisma.user.create({
      data: {
        id: lenderId,
        email: `escrow-lender-${lenderId}@integration.test`,
        password_hash: 'x',
        role: 'lender',
        kyc_status: 'verified',
      },
    });
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Escrow integration gear',
        rent_price_per_day: 100_000,
        value: 400_000,
        approval_status: 'approved',
        status: 'available',
      },
    });
  });

  async function createRenterWithWallet(balance: number, lockedBalance = 0) {
    const renterId = newId();
    await prisma.user.create({
      data: {
        id: renterId,
        email: `escrow-renter-${renterId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'verified',
      },
    });
    const wallet = await prisma.renterWallet.create({
      data: {
        user_id: renterId,
        balance,
        locked_balance: lockedBalance,
      },
    });
    return { renterId, wallet };
  }

  async function createTraditionalOrder(renterId: string) {
    const orderId = newId();
    return prisma.rentalOrder.create({
      data: {
        id: orderId,
        order_code: `ESCROW-${orderId}`,
        renter_id: renterId,
        lender_id: lenderId,
        gear_id: gearId,
        start_date: new Date('2026-09-01T00:00:00.000Z'),
        end_date: new Date('2026-09-02T00:00:00.000Z'),
        duration_days: 1,
        snapped_rent_price_per_day: 100_000,
        rental_fee: 100_000,
        base_rental_fee: 100_000,
        deposit_amount: 400_000,
        deposit_type: DepositTypeEnum.traditional,
        status: OrderStatusType.pending_confirm,
      },
    });
  }

  it('rolls back and returns INSUFFICIENT_CASH when traditional wallet has insufficient available cash', async () => {
    const { renterId, wallet } = await createRenterWithWallet(300_000);
    const order = await createTraditionalOrder(renterId);

    await expect(escrowService.lock(order.id)).rejects.toMatchObject({
      status: 400,
      response: { error: 'INSUFFICIENT_CASH' },
    });

    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: wallet.id } }),
    ).toMatchObject({
      balance: new Prisma.Decimal(300_000),
      locked_balance: new Prisma.Decimal(0),
    });
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(0);
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(0);
  });

  it('locks a traditional order by debiting rental fee, locking deposit, creating escrow, and recording ledger balances', async () => {
    const { renterId, wallet } = await createRenterWithWallet(600_000);
    const order = await createTraditionalOrder(renterId);

    const result = await escrowService.lock(order.id);

    expect(result).toMatchObject({
      orderId: order.id,
      amount: 400_000,
      source: 'renter_cash',
      status: 'locked',
    });
    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: wallet.id } }),
    ).toMatchObject({
      balance: new Prisma.Decimal(500_000),
      locked_balance: new Prisma.Decimal(400_000),
    });
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({
      amount: new Prisma.Decimal(400_000),
      source: 'renter_cash',
      status: 'locked',
    });
    await expect(
      prisma.renterWalletTransaction.findUniqueOrThrow({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).resolves.toMatchObject({
      wallet_id: wallet.id,
      type: 'order_lock',
      amount: new Prisma.Decimal(100_000),
      balance_before: new Prisma.Decimal(600_000),
      balance_after: new Prisma.Decimal(500_000),
    });
  });

  it('returns the existing escrow when lock is called twice without creating duplicates or debiting twice', async () => {
    const { renterId, wallet } = await createRenterWithWallet(600_000);
    const order = await createTraditionalOrder(renterId);

    const first = await escrowService.lock(order.id);
    const second = await escrowService.lock(order.id);

    expect(second).toEqual(first);
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: wallet.id } }),
    ).toMatchObject({
      balance: new Prisma.Decimal(500_000),
      locked_balance: new Prisma.Decimal(400_000),
    });
  });

  it('handles concurrent lock calls with one escrow and one wallet debit', async () => {
    const { renterId, wallet } = await createRenterWithWallet(600_000);
    const order = await createTraditionalOrder(renterId);

    const [first, second] = await Promise.all([
      escrowService.lock(order.id),
      escrowService.lock(order.id),
    ]);

    expect(second).toEqual(first);
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: wallet.id } }),
    ).toMatchObject({
      balance: new Prisma.Decimal(500_000),
      locked_balance: new Prisma.Decimal(400_000),
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.rentalOrder.deleteMany({
        where: { id: { in: fixtureIds } },
      });
      await prisma.gear.deleteMany({ where: { id: { in: fixtureIds } } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    }
    await app?.close();
  });
});
