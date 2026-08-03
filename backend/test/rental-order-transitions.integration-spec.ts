import type { INestApplication } from '@nestjs/common';
import {
  DepositTypeEnum,
  OrderStatusType,
  ProofStageEnum,
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
          role: 'renter',
          lender_enabled: true,
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
        { user_id: renterId, balance: 20_000_000 },
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
    await prisma.lenderWallet.create({
      data: { lender_id: lenderId, balance: 0 },
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

  async function addProof(
    orderId: string,
    uploadedBy: string,
    stage: ProofStageEnum,
  ) {
    return prisma.rentalProof.create({
      data: {
        id: newId(),
        rental_order_id: orderId,
        uploaded_by: uploadedBy,
        stage,
        proof_type: 'image',
        file_url: `/integration/${stage}.jpg`,
      },
    });
  }

  it('enforces actors, locks escrow once, and persists the complete lifecycle', async () => {
    const order = await createOrder(renterId);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    expect(repeatedConfirm.body).toMatchObject({
      data: { status: OrderStatusType.confirmed },
    });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(1);

    await addProof(order.id, lenderId, ProofStageEnum.pre_shipment);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/ship`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    const invalidConfirm = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);
    expect(invalidConfirm.body).toMatchObject({
      error: { code: 'INVALID_TRANSITION' },
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-receipt`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await addProof(order.id, renterId, ProofStageEnum.pre_return);
    await addProof(order.id, lenderId, ProofStageEnum.post_returned);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-return`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);

    const completedOrder = await prisma.rentalOrder.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(completedOrder.status).toBe(OrderStatusType.completed);
    expect(completedOrder.lender_shipped_at).toBeInstanceOf(Date);
    expect(completedOrder.renter_received_at).toBeInstanceOf(Date);
    expect(completedOrder.renter_returned_at).toBeInstanceOf(Date);
    expect(completedOrder.lender_received_back_at).toBeInstanceOf(Date);
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({ status: 'released' });
    expect(
      await prisma.lenderWalletTransaction.count({
        where: { rental_order_id: order.id, type: 'income' },
      }),
    ).toBe(1);
  });

  it('keeps the order pending when escrow reports INSUFFICIENT_CASH', async () => {
    const order = await createOrder(poorRenterId);
    const poorRenterToken = createJwt(poorRenterId, 'renter');
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
      .set('Cookie', createAccessTokenCookie(poorRenterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
  });

  it('refuses to confirm a pending order with inconsistent pre-existing escrow', async () => {
    const order = await createOrder(renterId);
    await prisma.escrowWallet.create({
      data: {
        rental_order_id: order.id,
        amount: order.deposit_amount,
        source: 'renter_cash',
        status: 'released',
        released_at: new Date(),
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'ESCROW_LOCK_INCONSISTENT' },
    });
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: OrderStatusType.pending_confirm });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(0);
  });

  it('gates ship and confirm-return on their required proofs', async () => {
    const order = await createOrder(renterId);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);

    const shipWithoutProof = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/ship`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);
    expect(shipWithoutProof.body).toMatchObject({
      error: { code: 'PROOF_REQUIRED' },
    });

    await addProof(order.id, lenderId, ProofStageEnum.pre_shipment);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/ship`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-receipt`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await addProof(order.id, renterId, ProofStageEnum.pre_return);

    const returnWithoutPostProof = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-return`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);
    expect(returnWithoutPostProof.body).toMatchObject({
      error: { code: 'PROOF_REQUIRED' },
    });
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: OrderStatusType.returning });
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({ status: 'locked' });
  });

  it('serializes duplicate confirm and cancel requests without duplicate side effects', async () => {
    const confirmOrder = await createOrder(renterId);
    const confirmRequests = [1, 2].map(() =>
      request(app.getHttpServer())
        .patch(`/api/v1/rental-orders/${confirmOrder.id}/confirm`)
        .set('Cookie', createAccessTokenCookie(lenderToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN),
    );
    const confirmResponses = await Promise.all(confirmRequests);
    expect(confirmResponses.map(({ status }) => status)).toEqual([200, 200]);
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: confirmOrder.id },
      }),
    ).toBe(1);
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${confirmOrder.id}` },
      }),
    ).toBe(1);

    const cancelOrder = await createOrder(renterId);
    const walletTxCountBefore = await prisma.renterWalletTransaction.count();
    const cancelRequests = [1, 2].map(() =>
      request(app.getHttpServer())
        .patch(`/api/v1/rental-orders/${cancelOrder.id}/cancel`)
        .set('Cookie', createAccessTokenCookie(renterToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN),
    );
    const cancelResponses = await Promise.all(cancelRequests);
    expect(cancelResponses.map(({ status }) => status)).toEqual([200, 200]);
    expect(await prisma.renterWalletTransaction.count()).toBe(
      walletTxCountBefore,
    );
    expect(
      await prisma.escrowWallet.count({
        where: { rental_order_id: cancelOrder.id },
      }),
    ).toBe(0);
  });

  it('serializes duplicate confirm-return requests and settles exactly once', async () => {
    const order = await createOrder(renterId);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await addProof(order.id, lenderId, ProofStageEnum.pre_shipment);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/ship`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-receipt`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/return`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    await addProof(order.id, renterId, ProofStageEnum.pre_return);
    await addProof(order.id, lenderId, ProofStageEnum.post_returned);

    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .patch(`/api/v1/rental-orders/${order.id}/confirm-return`)
          .set('Cookie', createAccessTokenCookie(lenderToken))
          .set('Origin', INTEGRATION_FRONTEND_ORIGIN),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(
      await prisma.lenderWalletTransaction.count({
        where: { rental_order_id: order.id, type: 'income' },
      }),
    ).toBe(1);
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({ status: 'released' });
  });

  it('makes concurrent confirm and cancel choose exactly one terminal outcome', async () => {
    const order = await createOrder(renterId);
    const [confirmResponse, cancelResponse] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/v1/rental-orders/${order.id}/confirm`)
        .set('Cookie', createAccessTokenCookie(lenderToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN),
      request(app.getHttpServer())
        .patch(`/api/v1/rental-orders/${order.id}/cancel`)
        .set('Cookie', createAccessTokenCookie(renterToken))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN),
    ]);
    expect([confirmResponse.status, cancelResponse.status].sort()).toEqual([
      200, 400,
    ]);

    const current = await prisma.rentalOrder.findUniqueOrThrow({
      where: { id: order.id },
    });
    const escrowCount = await prisma.escrowWallet.count({
      where: { rental_order_id: order.id },
    });
    const lockCount = await prisma.renterWalletTransaction.count({
      where: { reference: `LOCK-${order.id}` },
    });
    if (current.status === OrderStatusType.confirmed) {
      expect({ escrowCount, lockCount }).toEqual({
        escrowCount: 1,
        lockCount: 1,
      });
      expect(cancelResponse.body).toMatchObject({
        error: { code: 'CANCEL_NOT_ALLOWED' },
      });
    } else {
      expect(current.status).toBe(OrderStatusType.cancelled);
      expect({ escrowCount, lockCount }).toEqual({
        escrowCount: 0,
        lockCount: 0,
      });
      expect(confirmResponse.body).toMatchObject({
        error: { code: 'INVALID_TRANSITION' },
      });
    }
  });

  it('rejects cancel after confirm without changing any financial state', async () => {
    const order = await createOrder(renterId);
    await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);

    const walletBeforeCancel = await prisma.renterWallet.findUniqueOrThrow({
      where: { user_id: renterId },
    });
    const escrowBeforeCancel = await prisma.escrowWallet.findUniqueOrThrow({
      where: { rental_order_id: order.id },
    });
    const ledgerCountBeforeCancel = await prisma.renterWalletTransaction.count({
      where: { reference: `LOCK-${order.id}` },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/cancel`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'CANCEL_NOT_ALLOWED' },
    });
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: OrderStatusType.confirmed });
    await expect(
      prisma.renterWallet.findUniqueOrThrow({
        where: { user_id: renterId },
      }),
    ).resolves.toMatchObject({
      balance: walletBeforeCancel.balance,
      locked_balance: walletBeforeCancel.locked_balance,
    });
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({
      amount: escrowBeforeCancel.amount,
      status: 'locked',
      released_at: null,
    });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: `LOCK-${order.id}` },
      }),
    ).toBe(ledgerCountBeforeCancel);
  });

  it('confirms a credit-line order with credit lock, escrow, and debits rental fee from cash', async () => {
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
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
    const creditTransaction = await prisma.creditTransaction.findFirstOrThrow({
      where: {
        mutux_wallet_id: creditAfter.id,
        type: 'deposit_lock',
        ref_type: 'rental_order',
        ref_id: order.id,
        status: 'success',
      },
    });
    expect(creditTransaction).toMatchObject({
      direction: 'out',
      display_balance_before: creditBefore.display_balance,
      display_balance_after: creditBefore.display_balance.minus(
        order.deposit_amount,
      ),
    });
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
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
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
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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

  it('uses total limit minus locked balance and outstanding debt for credit availability', async () => {
    const constrainedRenterId = newId();
    await prisma.user.create({
      data: {
        id: constrainedRenterId,
        email: `constrained-renter-${constrainedRenterId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'verified',
      },
    });
    await prisma.renterWallet.create({
      data: { user_id: constrainedRenterId, balance: 10_000_000 },
    });
    await prisma.mutuxWallet.create({
      data: {
        user_id: constrainedRenterId,
        total_limit: 500_000,
        display_balance: 500_000,
        locked_balance: 200_000,
        outstanding_debt: 100_000,
        status: 'active',
      },
    });
    const order = await createOrder(
      constrainedRenterId,
      OrderStatusType.pending_confirm,
      DepositTypeEnum.credit_line,
    );

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INSUFFICIENT_CREDIT' },
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
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    expect(
      await prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: OrderStatusType.cancelled });
  });

  it('keeps a returning order and its escrow locked when settlement fails', async () => {
    const isolatedLenderId = newId();
    const isolatedRenterId = newId();
    const isolatedGearId = newId();
    const orderId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: isolatedLenderId,
          email: `settlement-lender-${isolatedLenderId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          lender_enabled: true,
          kyc_status: 'verified',
        },
        {
          id: isolatedRenterId,
          email: `settlement-renter-${isolatedRenterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
      ],
    });
    await prisma.gear.create({
      data: {
        id: isolatedGearId,
        lender_id: isolatedLenderId,
        name: 'Settlement rollback integration gear',
        rent_price_per_day: 100_000,
        value: 400_000,
        approval_status: 'approved',
        status: 'available',
      },
    });
    await prisma.renterWallet.create({
      data: {
        user_id: isolatedRenterId,
        balance: 900_000,
        locked_balance: 400_000,
      },
    });
    await prisma.rentalOrder.create({
      data: {
        id: orderId,
        order_code: `INT-${orderId}`,
        renter_id: isolatedRenterId,
        lender_id: isolatedLenderId,
        gear_id: isolatedGearId,
        start_date: new Date('2026-08-01T00:00:00.000Z'),
        end_date: new Date('2026-08-02T00:00:00.000Z'),
        duration_days: 1,
        snapped_rent_price_per_day: 100_000,
        rental_fee: 100_000,
        base_rental_fee: 100_000,
        deposit_amount: 400_000,
        deposit_type: DepositTypeEnum.traditional,
        platform_fee: 15_000,
        lender_income: 85_000,
        status: OrderStatusType.returning,
      },
    });
    await prisma.escrowWallet.create({
      data: {
        rental_order_id: orderId,
        amount: 400_000,
        source: 'renter_cash',
        status: 'locked',
      },
    });
    await addProof(orderId, isolatedRenterId, ProofStageEnum.pre_return);
    await addProof(orderId, isolatedLenderId, ProofStageEnum.post_returned);

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${orderId}/confirm-return`)
      .set(
        'Cookie',
        createAccessTokenCookie(createJwt(isolatedLenderId, 'lender')),
      )
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'LENDER_WALLET_NOT_FOUND' },
    });
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: orderId } }),
    ).resolves.toMatchObject({
      status: OrderStatusType.returning,
      lender_received_back_at: null,
    });
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: orderId },
      }),
    ).resolves.toMatchObject({
      status: 'locked',
      released_at: null,
    });
    const unchangedRenterWallet = await prisma.renterWallet.findUniqueOrThrow({
      where: { user_id: isolatedRenterId },
    });
    expect(unchangedRenterWallet.balance.toNumber()).toBe(900_000);
    expect(unchangedRenterWallet.locked_balance.toNumber()).toBe(400_000);
    expect(
      await prisma.lenderWalletTransaction.count({
        where: { rental_order_id: orderId },
      }),
    ).toBe(0);
  });

  it('refuses to complete when the settlement ledger and escrow disagree', async () => {
    const order = await createOrder(renterId, OrderStatusType.returning);
    await prisma.escrowWallet.create({
      data: {
        rental_order_id: order.id,
        amount: order.deposit_amount,
        source: 'renter_cash',
        status: 'locked',
      },
    });
    await addProof(order.id, renterId, ProofStageEnum.pre_return);
    await addProof(order.id, lenderId, ProofStageEnum.post_returned);
    const wallet = await prisma.lenderWallet.findUniqueOrThrow({
      where: { lender_id: lenderId },
    });
    await prisma.lenderWalletTransaction.create({
      data: {
        lender_wallet_id: wallet.id,
        rental_order_id: order.id,
        type: 'income',
        amount: 85_000,
        balance_before: wallet.balance,
        balance_after: wallet.balance.plus(85_000),
        note: 'Intentional inconsistent integration fixture',
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/rental-orders/${order.id}/confirm-return`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'SETTLEMENT_STATE_INCONSISTENT' },
    });
    await expect(
      prisma.rentalOrder.findUniqueOrThrow({ where: { id: order.id } }),
    ).resolves.toMatchObject({ status: OrderStatusType.returning });
    await expect(
      prisma.escrowWallet.findUniqueOrThrow({
        where: { rental_order_id: order.id },
      }),
    ).resolves.toMatchObject({ status: 'locked' });
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
