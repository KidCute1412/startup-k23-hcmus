/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import type { PrismaService } from '../../prisma/prisma.service';
import { stableStringify, WalletsService } from './wallets.service';

interface WalletTransactionMock {
  $queryRaw: jest.Mock;
  walletTopup: { findUnique: jest.Mock; update: jest.Mock };
  renterWallet: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
  renterWalletTransaction: { findUnique: jest.Mock; create: jest.Mock };
  lenderWallet: { findUnique: jest.Mock; update: jest.Mock };
  lenderWalletTransaction: { create: jest.Mock };
  bankAccount: { findFirst: jest.Mock; create: jest.Mock };
  withdrawal: { create: jest.Mock };
}

interface WalletPrismaMock {
  $transaction: jest.Mock;
  renterWallet: { upsert: jest.Mock };
  mutuxWallet: { findUnique: jest.Mock };
  walletTopup: { create: jest.Mock; findFirst: jest.Mock };
}

describe('WalletsService', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const walletId = '10000000-0000-0000-0000-000000000001';
  const topupId = '20000000-0000-0000-0000-000000000001';

  let prisma: WalletPrismaMock;
  let tx: WalletTransactionMock;
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
      lenderWallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      lenderWalletTransaction: { create: jest.fn() },
      bankAccount: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      withdrawal: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
      renterWallet: { upsert: jest.fn() },
      mutuxWallet: { findUnique: jest.fn() },
      walletTopup: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new WalletsService(prisma as unknown as PrismaService);
  });

  it('subtracts locked_balance from total balance for availableBalance in getRenter', async () => {
    prisma.renterWallet.upsert.mockResolvedValue({
      id: walletId,
      user_id: userId,
      balance: new Prisma.Decimal(5000000),
      locked_balance: new Prisma.Decimal(3000000),
      status: 'active',
      transactions: [],
    });

    const result = await service.getRenter(userId);

    expect(result).toMatchObject({
      id: walletId,
      userId,
      availableBalance: 2000000,
      lockedBalance: 3000000,
    });
  });

  it('marks an expired Mutux credit wallet as not granted', async () => {
    prisma.mutuxWallet.findUnique.mockResolvedValue({
      id: '30000000-0000-0000-0000-000000000001',
      user_id: userId,
      total_limit: new Prisma.Decimal(5_000_000),
      display_balance: new Prisma.Decimal(5_000_000),
      locked_balance: new Prisma.Decimal(0),
      outstanding_debt: new Prisma.Decimal(0),
      status: 'active',
      approved_at: new Date('2026-01-01T00:00:00.000Z'),
      expired_at: new Date('2026-01-02T00:00:00.000Z'),
    });

    await expect(service.getMutux(userId)).resolves.toMatchObject({
      granted: false,
      status: 'expired',
    });
  });

  it('rejects checkout amount = 0 with validation error', async () => {
    await expect(service.checkout(userId, 0, 'payos')).rejects.toMatchObject({
      status: 400,
    });
    expect(prisma.walletTopup.create).not.toHaveBeenCalled();
  });

  it('maps checkout to the stable camelCase contract with a numeric order code', async () => {
    prisma.renterWallet.upsert.mockResolvedValue({ id: walletId });
    prisma.walletTopup.create.mockImplementation(({ data }) => ({
      id: topupId,
      amount: new Prisma.Decimal(data.amount),
      order_code: data.order_code,
    }));

    const result = await service.checkout(userId, 500000, 'payos');

    expect(result).toMatchObject({
      topupId,
      amount: 500000,
      status: 'pending',
      paymentInstructions: {
        bankCode: expect.any(String),
        transferContent: expect.any(String),
      },
    });
    expect(Number.isSafeInteger(result.orderCode)).toBe(true);
  });

  it('rejects PayOS webhook with invalid HMAC and does not update balance', async () => {
    await expect(
      service.webhook(
        {
          code: '00',
          success: true,
          data: { orderCode: 1, amount: 100000, reference: 'REF-1' },
        },
        'bad-signature',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.walletTopup.findFirst).not.toHaveBeenCalled();
  });

  it('credits a duplicate webhook only once for the same order_code', async () => {
    const body = {
      code: '00',
      success: true,
      data: { orderCode: 1, amount: 100000, reference: 'PAYOS-REF-1' },
    };
    const signature = createHmac('sha256', 'test-secret')
      .update(stableStringify(body))
      .digest('hex');
    const pendingTopup = {
      id: topupId,
      wallet_id: walletId,
      order_code: 'TOPUP-1',
      amount: new Prisma.Decimal(100000),
      status: 'pending',
      wallet: { user_id: userId },
    };
    const successTopup = {
      ...pendingTopup,
      status: 'success',
      provider_reference: 'PAYOS-REF-1',
      wallet: { user_id: userId, balance: new Prisma.Decimal(150000) },
    };

    prisma.walletTopup.findFirst.mockResolvedValue({
      id: topupId,
      amount: new Prisma.Decimal(100000),
    });
    tx.walletTopup.findUnique
      .mockResolvedValueOnce(pendingTopup)
      .mockResolvedValueOnce(null)
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
      wallet: { user_id: userId, balance: new Prisma.Decimal(100000) },
    };
    tx.walletTopup.findUnique.mockResolvedValue(successTopup);

    await expect(service.completeTopup(topupId, userId)).resolves.toEqual({
      topupId,
      status: 'success',
      walletBalance: 100000,
    });
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

  it('atomically creates a pending withdrawal and matching lender ledger entry', async () => {
    tx.lenderWallet.findUnique.mockResolvedValue({
      id: walletId,
      balance: new Prisma.Decimal(500000),
      status: 'active',
    });
    tx.bankAccount.findFirst.mockResolvedValue({
      id: 'bank-account-id',
    });
    tx.withdrawal.create.mockResolvedValue({
      id: 'withdrawal-id',
      status: 'pending',
    });

    await expect(
      service.withdraw(userId, {
        amount: 100000,
        bankCode: 'MB',
        accountNumber: '123456789',
        accountHolder: 'NGUYEN VAN A',
      }),
    ).resolves.toEqual({
      id: 'withdrawal-id',
      status: 'pending',
      amount: 100000,
      balance: 400000,
    });
    expect(tx.lenderWalletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'withdrawal',
        balance_before: new Prisma.Decimal(500000),
        balance_after: new Prisma.Decimal(400000),
      }),
    });
  });

  it('rejects a withdrawal larger than the lender balance', async () => {
    tx.lenderWallet.findUnique.mockResolvedValue({
      id: walletId,
      balance: new Prisma.Decimal(50000),
      status: 'active',
    });

    await expect(
      service.withdraw(userId, {
        amount: 100000,
        bankCode: 'MB',
        accountNumber: '123456789',
        accountHolder: 'NGUYEN VAN A',
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(tx.withdrawal.create).not.toHaveBeenCalled();
    expect(tx.lenderWallet.update).not.toHaveBeenCalled();
  });
});
