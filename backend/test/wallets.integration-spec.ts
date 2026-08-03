/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { stableStringify } from '../src/modules/wallets/wallets.service';
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

describeIntegration('Wallet topups (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let renterId: string;
  let renterToken: string;
  let walletId: string;
  let lenderId: string;
  let lenderToken: string;
  let lenderWalletId: string;
  let adminToken: string;
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

    lenderId = newId();
    const adminId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: lenderId,
          email: `wallet-lender-${lenderId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          lender_enabled: true,
          kyc_status: 'verified',
        },
        {
          id: adminId,
          email: `wallet-admin-${adminId}@integration.test`,
          password_hash: 'x',
          role: 'admin',
          kyc_status: 'verified',
        },
      ],
    });
    const lenderWallet = await prisma.lenderWallet.create({
      data: { lender_id: lenderId, balance: 500_000 },
    });
    lenderWalletId = lenderWallet.id;
    lenderToken = createJwt(lenderId, 'lender');
    adminToken = createJwt(adminId, 'admin');
  });

  it('rejects checkout amount = 0 with validation error and creates no topup', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({ amount: 0, method: 'payos' })
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
      .send({
        code: '00',
        success: true,
        data: {
          orderCode,
          amount: 100_000,
          reference: 'PAYOS-BAD-SIG',
        },
      })
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
    const reference = 'PAYOS-DUPLICATE-REF';
    await prisma.renterWallet.update({
      where: { id: walletId },
      data: { balance: 50_000, locked_balance: 0 },
    });
    const checkout = await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({ amount: 100_000, method: 'payos' })
      .expect(201);
    const { orderCode, topupId } = checkout.body.data;
    const body = {
      code: '00',
      success: true,
      data: { orderCode, amount: 100_000, reference },
    };
    const rawBody = JSON.stringify(body);
    const signature = createHmac('sha256', 'wallet-webhook-secret')
      .update(stableStringify(body))
      .digest('hex');

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('Content-Type', 'application/json')
      .set('x-payos-signature', signature)
      .send(rawBody)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('Content-Type', 'application/json')
      .set('x-payos-signature', signature)
      .send(rawBody)
      .expect(200);

    expect(checkout.body.data).toMatchObject({
      topupId,
      orderCode,
      amount: 100_000,
      status: 'pending',
    });

    const walletAfter = await prisma.renterWallet.findUniqueOrThrow({
      where: { id: walletId },
    });
    expect(walletAfter.balance).toEqual(new Prisma.Decimal(150_000));
    expect(
      await prisma.renterWalletTransaction.count({
        where: { reference: String(orderCode) },
      }),
    ).toBe(1);
    await expect(
      prisma.renterWalletTransaction.findUniqueOrThrow({
        where: { reference: String(orderCode) },
      }),
    ).resolves.toMatchObject({
      amount: new Prisma.Decimal(100_000),
      balance_before: new Prisma.Decimal(50_000),
      balance_after: new Prisma.Decimal(150_000),
    });
    await expect(
      prisma.walletTopup.findUniqueOrThrow({ where: { id: topupId } }),
    ).resolves.toMatchObject({
      status: 'success',
      provider_reference: reference,
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
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);
    const repeated = await request(app.getHttpServer())
      .post(`/api/v1/wallets/topups/${topup.id}/simulate-success`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(200);

    expect(repeated.body).toMatchObject({
      success: true,
      data: { topupId: topup.id, status: 'success', walletBalance: 80_000 },
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

  it.each([
    ['renter', () => renterToken],
    ['admin', () => adminToken],
  ])(
    'rejects lender withdrawal for %s without changing balance, withdrawal, bank account, or ledger',
    async (_role, token) => {
      const walletBefore = await prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      });
      const [withdrawalsBefore, bankAccountsBefore, ledgerBefore] =
        await Promise.all([
          prisma.withdrawal.count(),
          prisma.bankAccount.count(),
          prisma.lenderWalletTransaction.count({
            where: { lender_wallet_id: lenderWalletId },
          }),
        ]);

      await request(app.getHttpServer())
        .post('/api/v1/wallets/lender/withdraw')
        .set('Cookie', createAccessTokenCookie(token()))
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          amount: 100_000,
          bankCode: 'MB',
          accountNumber: '123456789',
          accountHolder: 'NGUYEN VAN A',
        })
        .expect(403);

      await expect(
        prisma.lenderWallet.findUniqueOrThrow({
          where: { id: lenderWalletId },
        }),
      ).resolves.toMatchObject({
        balance: walletBefore.balance,
        total_withdrawn: walletBefore.total_withdrawn,
      });
      await expect(prisma.withdrawal.count()).resolves.toBe(withdrawalsBefore);
      await expect(prisma.bankAccount.count()).resolves.toBe(
        bankAccountsBefore,
      );
      await expect(
        prisma.lenderWalletTransaction.count({
          where: { lender_wallet_id: lenderWalletId },
        }),
      ).resolves.toBe(ledgerBefore);
    },
  );

  it('allows a lender to create an atomic demo withdrawal', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallets/lender/withdraw')
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({
        amount: 100_000,
        bankCode: 'MB',
        accountNumber: '987654321',
        accountHolder: 'NGUYEN VAN B',
      })
      .expect(200);

    await expect(
      prisma.lenderWallet.findUniqueOrThrow({
        where: { id: lenderWalletId },
      }),
    ).resolves.toMatchObject({
      balance: new Prisma.Decimal(400_000),
      total_withdrawn: new Prisma.Decimal(100_000),
    });
    await expect(
      prisma.lenderWalletTransaction.count({
        where: { lender_wallet_id: lenderWalletId, type: 'withdrawal' },
      }),
    ).resolves.toBe(1);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.withdrawal.deleteMany({
        where: { lender_wallet_id: lenderWalletId },
      });
      await prisma.lenderWalletTransaction.deleteMany({
        where: { lender_wallet_id: lenderWalletId },
      });
      await prisma.bankAccount.deleteMany({ where: { user_id: lenderId } });
      await prisma.lenderWallet.deleteMany({ where: { id: lenderWalletId } });
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
