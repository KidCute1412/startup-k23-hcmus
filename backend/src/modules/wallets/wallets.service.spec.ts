/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { WalletsService } from './wallets.service';

describe('WalletsService', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const walletId = '10000000-0000-0000-0000-000000000001';
  const topupId = '20000000-0000-0000-0000-000000000001';

  let prisma: any;
  let tx: any;
  let service: WalletsService;

  beforeEach(() => {
    process.env.PAYOS_WEBHOOK_SECRET = 'test-secret';
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      walletTopup: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      renterWallet: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      renterWalletTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
      renterWallet: { upsert: jest.fn() },
      walletTopup: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new WalletsService(prisma);
  });

  it('rejects checkout amount = 0 with validation error', async () => {
    await expect(service.checkout(userId, 0)).rejects.toMatchObject({
      status: 400,
    });
    expect(prisma.walletTopup.create).not.toHaveBeenCalled();
  });

  it('rejects PayOS webhook with invalid HMAC and does not update balance', async () => {
    await expect(
      service.webhook({ orderCode: 'TOPUP-1' }, 'bad-signature'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.walletTopup.findFirst).not.toHaveBeenCalled();
  });

  it('credits a duplicate webhook only once for the same order_code', async () => {
    const body = { orderCode: 'TOPUP-1', data: { reference: 'PAYOS-REF-1' } };
    const signature = createHmac('sha256', 'test-secret')
      .update(JSON.stringify(body))
      .digest('hex');
    const pendingTopup = {
      id: topupId,
      wallet_id: walletId,
      order_code: 'TOPUP-1',
      amount: new Prisma.Decimal(100000),
      status: 'pending',
      wallet: { user_id: userId },
    };
    const successTopup = { ...pendingTopup, status: 'success' };

    prisma.walletTopup.findFirst.mockResolvedValue({ id: topupId });
    tx.walletTopup.findUnique
      .mockResolvedValueOnce(pendingTopup)
      .mockResolvedValueOnce(successTopup);
    tx.renterWallet.findUniqueOrThrow.mockResolvedValue({
      id: walletId,
      balance: new Prisma.Decimal(50000),
    });
    tx.walletTopup.update.mockResolvedValue(successTopup);

    await service.webhook(body, signature);
    await service.webhook(body, signature);

    expect(tx.renterWallet.update).toHaveBeenCalledTimes(1);
    expect(tx.renterWalletTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('returns current topup when simulate-success is repeated without crediting again', async () => {
    const successTopup = {
      id: topupId,
      wallet_id: walletId,
      order_code: 'TOPUP-1',
      amount: new Prisma.Decimal(100000),
      status: 'success',
      wallet: { user_id: userId },
    };
    tx.walletTopup.findUnique.mockResolvedValue(successTopup);

    await expect(service.completeTopup(topupId, userId)).resolves.toBe(
      successTopup,
    );
    expect(tx.renterWallet.update).not.toHaveBeenCalled();
    expect(tx.renterWalletTransaction.create).not.toHaveBeenCalled();
  });

  it('records renter wallet transaction balance_before and balance_after', async () => {
    const topup = {
      id: topupId,
      wallet_id: walletId,
      order_code: 'TOPUP-1',
      amount: new Prisma.Decimal(100000),
      status: 'pending',
      wallet: { user_id: userId },
    };
    tx.walletTopup.findUnique.mockResolvedValue(topup);
    tx.renterWallet.findUniqueOrThrow.mockResolvedValue({
      id: walletId,
      balance: new Prisma.Decimal(50000),
    });
    tx.walletTopup.update.mockResolvedValue({ ...topup, status: 'success' });

    await service.completeTopup(topupId, userId);

    expect(tx.renterWalletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        balance_before: new Prisma.Decimal(50000),
        balance_after: new Prisma.Decimal(150000),
      }),
    });
  });
});
