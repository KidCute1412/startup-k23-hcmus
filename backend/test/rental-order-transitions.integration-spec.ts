import type { INestApplication } from '@nestjs/common';
import { DepositTypeEnum, OrderStatusType } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createFixtureIds,
  createIntegrationApp,
  createJwt,
} from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Rental order transitions (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let lenderId: string;
  let renterId: string;
  let poorRenterId: string;
  let gearId: string;
  let lenderToken: string;
  let renterToken: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'rental-order-integration-test-secret';
    ({ app, prisma } = await createIntegrationApp());

    lenderId = newId();
    renterId = newId();
    poorRenterId = newId();
    gearId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: lenderId,
          email: `lender-${lenderId}@integration.test`,
          password_hash: 'x',
          role: 'lender',
          kyc_status: 'verified',
        },
        {
          id: renterId,
          email: `renter-${renterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
        {
          id: poorRenterId,
          email: `poor-renter-${poorRenterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
      ],
    });
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Lifecycle integration gear',
        rent_price_per_day: 100_000,
        value: 400_000,
        approval_status: 'approved',
        status: 'available',
      },
    });
    await prisma.renterWallet.createMany({
      data: [
        { user_id: renterId, balance: 2_000_000 },
        { user_id: poorRenterId, balance: 300_000 },
      ],
    });
    await prisma.mutuxWallet.createMany({
      data: [
        {
          user_id: renterId,
          total_limit: 1_000_000,
          display_balance: 1_000_000,
          status: 'active',
        },
        {
          user_id: poorRenterId,
          total_limit: 300_000,
          display_balance: 300_000,
          status: 'active',
        },
      ],
    });

    lenderToken = createJwt(lenderId, 'lender');
    renterToken = createJwt(renterId, 'renter');
  });

  async function createOrder(
    ownerId: string,
    status = OrderStatusType.pending_confirm,
    depositType = DepositTypeEnum.traditional,
  ) {
    const id = newId();
    return prisma.rentalOrder.create({
      data: {
        id,
        order_code: `INT-${id}`,
        renter_id: ownerId,
        lender_id: lenderId,
        gear_id: gearId,
        start_date: new Date('2026-08-01T00:00:00.000Z'),
        end_date: new Date('2026-08-02T00:00:00.000Z'),
        duration_days: 1,
        snapped_rent_price_per_day: 100_000,
        rental_fee: 100_000,
        base_rental_fee: 100_000,
        deposit_amount: 400_000,
        deposit_type: depositType,
        status,
      },
    });
  }

  it('enforces actors, locks escrow once, and persists the complete lifecycle', async () => {
    const order = await createOrder(renterId);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);
    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.confirmed });
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(1);

    const repeatedConfirm = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(400);
    expect(repeatedConfirm.body).toMatchObject({
      error: { code: 'INVALID_TRANSITION' },
    });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/ship`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);
    const invalidConfirm = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(400);
    expect(invalidConfirm.body).toMatchObject({
      error: { code: 'INVALID_TRANSITION' },
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-receipt`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-return`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);

    const completedOrder = await prisma.rentalOrder.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(completedOrder.status).toBe(OrderStatusType.completed);
    expect(completedOrder.lender_shipped_at).toBeInstanceOf(Date);
    expect(completedOrder.renter_received_at).toBeInstanceOf(Date);
    expect(completedOrder.renter_returned_at).toBeInstanceOf(Date);
    expect(completedOrder.lender_received_back_at).toBeInstanceOf(Date);
  });

  it('keeps the order pending when escrow reports INSUFFICIENT_CASH', async () => {
    const order = await createOrder(poorRenterId);
    const poorRenterToken = createJwt(poorRenterId, 'renter');
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INSUFFICIENT_CASH' },
    });
    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.pending_confirm });
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(0);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${poorRenterToken}`)
      .expect(200);
  });

  it('confirms a credit-line order with cash fee debit, credit lock, escrow, and ledgers', async () => {
    const order = await createOrder(
      renterId,
      OrderStatusType.pending_confirm,
      DepositTypeEnum.credit_line,
    );
    const cashBefore = await prisma.renterWallet.findUniqueOrThrow({
      where: { user_id: renterId },
    });
    const creditBefore = await prisma.mutuxWallet.findUniqueOrThrow({
      where: { user_id: renterId },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);

    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.confirmed });
    expect(
      await prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).toMatchObject({
      amount: order.deposit_amount,
      source: 'credit_line',
      status: 'locked',
    });
    const cashAfter = await prisma.renterWallet.findUniqueOrThrow({
      where: { user_id: renterId },
    });
    expect(cashAfter.balance).toEqual(
      cashBefore.balance.minus(order.rental_fee),
    );
    expect(cashAfter.locked_balance).toEqual(cashBefore.locked_balance);
    const creditAfter = await prisma.mutuxWallet.findUniqueOrThrow({
      where: { user_id: renterId },
    });
    expect(creditAfter.display_balance).toEqual(
      creditBefore.display_balance.minus(order.deposit_amount),
    );
    expect(creditAfter.locked_balance).toEqual(
      creditBefore.locked_balance.plus(order.deposit_amount),
    );
    expect(
      await prisma.creditTransaction.count({
        where: {
          mutux_wallet_id: creditAfter.id,
          type: 'deposit_lock',
          ref_type: 'rental_order',
          ref_id: order.id,
          status: 'success',
        },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(400);
    expect(
      await prisma.creditTransaction.count({ where: { ref_id: order.id } }),
    ).toBe(1);
  });

  it('keeps a credit-line order pending and rolls back cash when credit is insufficient', async () => {
    const order = await createOrder(
      poorRenterId,
      OrderStatusType.pending_confirm,
      DepositTypeEnum.credit_line,
    );
    const cashBefore = await prisma.renterWallet.findUniqueOrThrow({
      where: { user_id: poorRenterId },
    });
    const creditBefore = await prisma.mutuxWallet.findUniqueOrThrow({
      where: { user_id: poorRenterId },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INSUFFICIENT_CREDIT' },
    });
    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.pending_confirm });
    expect(
      await prisma.renterWallet.findUniqueOrThrow({
        where: { user_id: poorRenterId },
      }),
    ).toMatchObject({
      balance: cashBefore.balance,
      locked_balance: cashBefore.locked_balance,
    });
    expect(
      await prisma.mutuxWallet.findUniqueOrThrow({
        where: { user_id: poorRenterId },
      }),
    ).toMatchObject({
      display_balance: creditBefore.display_balance,
      locked_balance: creditBefore.locked_balance,
    });
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: order.id },
      }),
    ).toBe(0);
    expect(
      await prisma.creditTransaction.count({ where: { ref_id: order.id } }),
    ).toBe(0);
  });

  it('lets the renter cancel an untouched pending order', async () => {
    const order = await createOrder(renterId);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/cancel`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(200);
    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.cancelled });
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
