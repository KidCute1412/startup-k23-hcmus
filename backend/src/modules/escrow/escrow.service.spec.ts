/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from './escrow.service';

interface EscrowRecord {
  id: string;
  rental_order_id: string;
  amount: Prisma.Decimal;
  source: 'renter_cash' | 'credit_line';
  status: 'locked';
}

interface EscrowState {
  order: {
    id: string;
    renter_id: string;
    deposit_type: string;
    rental_fee: Prisma.Decimal;
    deposit_amount: Prisma.Decimal;
    escrow_wallet: EscrowRecord | null;
  };
  wallet: {
    id: string;
    user_id: string;
    balance: Prisma.Decimal;
    locked_balance: Prisma.Decimal;
  };
  creditWallet: {
    id: string;
    user_id: string;
    display_balance: Prisma.Decimal;
    locked_balance: Prisma.Decimal;
    status: 'active' | 'suspended';
    expired_at: Date | null;
  } | null;
  transactions: Map<string, object>;
  creditTransactions: object[];
}

interface EscrowTransactionMock {
  $queryRaw: jest.Mock;
  rentalOrder: { findUnique: jest.Mock };
  escrowWallet: { findUnique: jest.Mock; create: jest.Mock };
  renterWallet: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
  };
  renterWalletTransaction: { findUnique: jest.Mock; create: jest.Mock };
  mutuxWallet: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    update: jest.Mock;
  };
  creditTransaction: { create: jest.Mock };
}

interface EscrowPrismaMock {
  $transaction: jest.Mock;
}

describe('EscrowService', () => {
  const orderId = '30000000-0000-0000-0000-000000000001';
  const renterId = '00000000-0000-0000-0000-000000000001';
  const walletId = '10000000-0000-0000-0000-000000000001';
  const creditWalletId = '50000000-0000-0000-0000-000000000001';

  let prisma: EscrowPrismaMock;
  let tx: EscrowTransactionMock;
  let state: EscrowState;
  let transactionQueue: Promise<unknown>;
  let service: EscrowService;

  beforeEach(() => {
    state = {
      order: {
        id: orderId,
        renter_id: renterId,
        deposit_type: 'traditional',
        rental_fee: new Prisma.Decimal(100000),
        deposit_amount: new Prisma.Decimal(400000),
        escrow_wallet: null,
      },
      wallet: {
        id: walletId,
        user_id: renterId,
        balance: new Prisma.Decimal(600000),
        locked_balance: new Prisma.Decimal(0),
      },
      creditWallet: {
        id: creditWalletId,
        user_id: renterId,
        display_balance: new Prisma.Decimal(500000),
        locked_balance: new Prisma.Decimal(0),
        status: 'active',
        expired_at: null,
      },
      transactions: new Map<string, object>(),
      creditTransactions: [],
    };
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      rentalOrder: {
        findUnique: jest.fn(async () => ({
          ...state.order,
          escrow_wallet: state.order.escrow_wallet,
        })),
      },
      escrowWallet: {
        findUnique: jest.fn(async () => state.order.escrow_wallet),
        create: jest.fn(async ({ data }) => {
          state.order.escrow_wallet = {
            id: 'escrow-id',
            rental_order_id: data.rental_order_id,
            amount: data.amount,
            source: data.source,
            status: data.status,
          };
          return state.order.escrow_wallet;
        }),
      },
      renterWallet: {
        findUnique: jest.fn(async () => ({ ...state.wallet })),
        findUniqueOrThrow: jest.fn(async () => ({ ...state.wallet })),
        update: jest.fn(async ({ data }) => {
          state.wallet.balance = data.balance;
          state.wallet.locked_balance = data.locked_balance;
          return state.wallet;
        }),
      },
      renterWalletTransaction: {
        findUnique: jest.fn(
          async ({ where }) => state.transactions.get(where.reference) ?? null,
        ),
        create: jest.fn(async ({ data }) => {
          state.transactions.set(data.reference, data);
          return data;
        }),
      },
      mutuxWallet: {
        findUnique: jest.fn(async () =>
          state.creditWallet ? { id: state.creditWallet.id } : null,
        ),
        findUniqueOrThrow: jest.fn(async () => {
          if (!state.creditWallet) throw new Error('Credit wallet not found');
          return { ...state.creditWallet };
        }),
        update: jest.fn(async ({ data }) => {
          if (!state.creditWallet) throw new Error('Credit wallet not found');
          state.creditWallet.display_balance = data.display_balance;
          state.creditWallet.locked_balance = data.locked_balance;
          return state.creditWallet;
        }),
      },
      creditTransaction: {
        create: jest.fn(async ({ data }) => {
          state.creditTransactions.push(data);
          return data;
        }),
      },
    };
    transactionQueue = Promise.resolve();
    prisma = {
      $transaction: jest.fn((callback) => {
        transactionQueue = transactionQueue.then(() => callback(tx));
        return transactionQueue;
      }),
    };
    service = new EscrowService(prisma as unknown as PrismaService);
  });

  it('rolls back traditional lock with INSUFFICIENT_CASH when available cash is below required cash', async () => {
    state.wallet.balance = new Prisma.Decimal(300000);

    await expect(service.lock(orderId)).rejects.toMatchObject({
      status: 400,
      response: { error: 'INSUFFICIENT_CASH' },
    });
    expect(tx.escrowWallet.create).not.toHaveBeenCalled();
    expect(tx.renterWallet.update).not.toHaveBeenCalled();
  });

  it('locks traditional order by debiting rental fee, increasing locked balance, creating escrow and ledger', async () => {
    const result = await service.lock(orderId);

    expect(result).toEqual({
      escrowId: 'escrow-id',
      orderId,
      amount: 400000,
      source: 'renter_cash',
      status: 'locked',
    });
    expect(state.wallet.balance).toEqual(new Prisma.Decimal(500000));
    expect(state.wallet.locked_balance).toEqual(new Prisma.Decimal(400000));
    expect(tx.renterWalletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reference: `LOCK-${orderId}`,
        balance_before: new Prisma.Decimal(600000),
        balance_after: new Prisma.Decimal(500000),
      }),
    });
  });

  it('returns current escrow when lock is called twice for the same order', async () => {
    const first = await service.lock(orderId);
    const second = await service.lock(orderId);

    expect(second).toEqual(first);
    expect(tx.escrowWallet.create).toHaveBeenCalledTimes(1);
    expect(tx.renterWallet.update).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent lock calls with one escrow and one wallet debit', async () => {
    const [first, second] = await Promise.all([
      service.lock(orderId),
      service.lock(orderId),
    ]);

    expect(second).toEqual(first);
    expect(tx.escrowWallet.create).toHaveBeenCalledTimes(1);
    expect(tx.renterWallet.update).toHaveBeenCalledTimes(1);
    expect(state.wallet.balance).toEqual(new Prisma.Decimal(500000));
    expect(state.wallet.locked_balance).toEqual(new Prisma.Decimal(400000));
  });

  it('locks a credit-line deposit while debiting only the rental fee from cash', async () => {
    state.order.deposit_type = 'credit_line';
    state.wallet.balance = new Prisma.Decimal(200000);

    const result = await service.lock(orderId);

    expect(result).toEqual({
      escrowId: 'escrow-id',
      orderId,
      amount: 400000,
      source: 'credit_line',
      status: 'locked',
    });
    expect(state.wallet.balance).toEqual(new Prisma.Decimal(100000));
    expect(state.wallet.locked_balance).toEqual(new Prisma.Decimal(0));
    expect(state.creditWallet?.display_balance).toEqual(
      new Prisma.Decimal(100000),
    );
    expect(state.creditWallet?.locked_balance).toEqual(
      new Prisma.Decimal(400000),
    );
    expect(tx.creditTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mutux_wallet_id: creditWalletId,
        type: 'deposit_lock',
        amount: new Prisma.Decimal(400000),
        display_balance_before: new Prisma.Decimal(500000),
        display_balance_after: new Prisma.Decimal(100000),
        direction: 'out',
        ref_type: 'rental_order',
        ref_id: orderId,
        status: 'success',
      }),
    });
  });

  it('rolls back a credit-line lock when cash cannot cover the rental fee', async () => {
    state.order.deposit_type = 'credit_line';
    state.wallet.balance = new Prisma.Decimal(50000);

    await expect(service.lock(orderId)).rejects.toMatchObject({
      status: 400,
      response: { error: 'INSUFFICIENT_CASH' },
    });
    expect(tx.renterWallet.update).not.toHaveBeenCalled();
    expect(tx.mutuxWallet.update).not.toHaveBeenCalled();
    expect(tx.escrowWallet.create).not.toHaveBeenCalled();
  });

  it('rolls back a credit-line lock when available credit is insufficient', async () => {
    state.order.deposit_type = 'credit_line';
    state.creditWallet!.display_balance = new Prisma.Decimal(300000);

    await expect(service.lock(orderId)).rejects.toMatchObject({
      status: 400,
      response: { error: 'INSUFFICIENT_CREDIT' },
    });
    expect(tx.renterWallet.update).not.toHaveBeenCalled();
    expect(tx.mutuxWallet.update).not.toHaveBeenCalled();
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
    expect(tx.escrowWallet.create).not.toHaveBeenCalled();
  });

  it('returns the existing credit-line escrow without debiting either wallet twice', async () => {
    state.order.deposit_type = 'credit_line';

    const first = await service.lock(orderId);
    const second = await service.lock(orderId);

    expect(second).toEqual(first);
    expect(tx.renterWallet.update).toHaveBeenCalledTimes(1);
    expect(tx.mutuxWallet.update).toHaveBeenCalledTimes(1);
    expect(tx.creditTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.escrowWallet.create).toHaveBeenCalledTimes(1);
  });
});
