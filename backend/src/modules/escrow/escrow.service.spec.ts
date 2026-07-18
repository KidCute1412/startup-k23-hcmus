/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Prisma } from '@prisma/client';
import { EscrowService } from './escrow.service';

describe('EscrowService', () => {
  const orderId = '30000000-0000-0000-0000-000000000001';
  const renterId = '00000000-0000-0000-0000-000000000001';
  const walletId = '10000000-0000-0000-0000-000000000001';

  let prisma: any;
  let tx: any;
  let state: any;
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
      transactions: new Map<string, object>(),
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
    };
    transactionQueue = Promise.resolve();
    prisma = {
      $transaction: jest.fn((callback) => {
        transactionQueue = transactionQueue.then(() => callback(tx));
        return transactionQueue;
      }),
    };
    service = new EscrowService(prisma);
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
});
