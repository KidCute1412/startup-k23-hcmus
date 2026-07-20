import type { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
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

describeIntegration('Wallet topups (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let renterId: string;
  let renterToken: string;
  let walletId: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'wallet-integration-test-secret';
    process.env.PAYOS_WEBHOOK_SECRET = 'wallet-webhook-secret';
    ({ app, prisma } = await createIntegrationApp());

    renterId = newId();
    await prisma.user.create({
      data: {
        id: renterId,
        email: `wallet-renter-${renterId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'verified',
      },
    });
    const wallet = await prisma.renterWallet.create({
      data: { user_id: renterId, balance: 0 },
    });
    walletId = wallet.id;
    renterToken = createJwt(renterId, 'renter');
  });

  it('rejects checkout amount = 0 with validation error and creates no topup', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .set('Authorization', `Bearer ${renterToken}`)
      .send({ amount: 0 })
      .expect(400);

    expect(
      await prisma.walletTopup.count({ where: { wallet_id: walletId } }),
    ).toBe(0);
  });

  it('rejects PayOS webhook with invalid HMAC and does not update balance', async () => {
    const orderCode = 91000001;
    await prisma.walletTopup.create({
      data: {
        wallet_id: walletId,
        amount: 100_000,
        order_code: String(orderCode),
      },
    });
    const walletBefore = await prisma.renterWallet.findUniqueOrThrow({
      where: { id: walletId },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('x-payos-signature', 'bad-signature')
      .send({ data: { orderCode, reference: 'PAYOS-BAD-SIG' } })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_SIGNATURE' },
    });
    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: walletId } }),
    ).toMatchObject({
      balance: walletBefore.balance,
      locked_balance: walletBefore.locked_balance,
    });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: 'PAYOS-BAD-SIG' },
      }),
    ).toBe(0);
  });

  it('credits duplicate PayOS webhooks for the same order_code only once and records ledger balances', async () => {
    const orderCode = 91000002;
    const reference = 'PAYOS-DUPLICATE-REF';
    await prisma.renterWallet.update({
      where: { id: walletId },
      data: { balance: 50_000, locked_balance: 0 },
    });
    await prisma.walletTopup.create({
      data: {
        wallet_id: walletId,
        amount: 100_000,
        order_code: String(orderCode),
      },
    });
    const body = { data: { orderCode, reference } };
    const rawBody = JSON.stringify(body);
    const signature = createHmac('sha256', 'wallet-webhook-secret')
      .update(rawBody)
      .digest('hex');

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('Content-Type', 'application/json')
      .set('x-payos-signature', signature)
      .send(rawBody)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('Content-Type', 'application/json')
      .set('x-payos-signature', signature)
      .send(rawBody)
      .expect(201);

    const walletAfter = await prisma.renterWallet.findUniqueOrThrow({
      where: { id: walletId },
    });
    expect(walletAfter.balance).toEqual(new Prisma.Decimal(150_000));
    expect(
      await prisma.renterWalletTransaction.count({ where: { reference } }),
    ).toBe(1);
    await expect(
      prisma.renterWalletTransaction.findUniqueOrThrow({
        where: { reference },
      }),
    ).resolves.toMatchObject({
      amount: new Prisma.Decimal(100_000),
      balance_before: new Prisma.Decimal(50_000),
      balance_after: new Prisma.Decimal(150_000),
    });
  });

  it('does not credit again when simulate-success is called after topup is already success', async () => {
    await prisma.renterWallet.update({
      where: { id: walletId },
      data: { balance: 10_000, locked_balance: 0 },
    });
    const topup = await prisma.walletTopup.create({
      data: {
        wallet_id: walletId,
        amount: 70_000,
        order_code: 'SIMULATE-IDEMPOTENT',
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/wallets/topups/${topup.id}/simulate-success`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(201);
    const repeated = await request(app.getHttpServer())
      .post(`/api/v1/wallets/topups/${topup.id}/simulate-success`)
      .set('Authorization', `Bearer ${renterToken}`)
      .expect(201);

    expect(repeated.body).toMatchObject({
      success: true,
      data: { id: topup.id, status: 'success' },
    });
    expect(
      await prisma.renterWallet.findUniqueOrThrow({ where: { id: walletId } }),
    ).toMatchObject({ balance: new Prisma.Decimal(80_000) });
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: 'SIMULATE-IDEMPOTENT' },
      }),
    ).toBe(1);
    await expect(
      prisma.renterWalletTransaction.findUniqueOrThrow({
        where: { reference: 'SIMULATE-IDEMPOTENT' },
      }),
    ).resolves.toMatchObject({
      balance_before: new Prisma.Decimal(10_000),
      balance_after: new Prisma.Decimal(80_000),
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.walletTopup.deleteMany({ where: { wallet_id: walletId } });
      await prisma.renterWalletTransaction.deleteMany({
        where: { wallet_id: walletId },
      });
      await prisma.renterWallet.deleteMany({ where: { id: walletId } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    }
    await app?.close();
  });
});
