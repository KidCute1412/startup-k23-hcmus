import { Prisma } from '@prisma/client';
import { EscrowReconciliationService } from './escrow-reconciliation.service';

describe('EscrowReconciliationService', () => {
  const service = new EscrowReconciliationService();

  function createTx(wallet: {
    total_limit: Prisma.Decimal;
    locked_balance: Prisma.Decimal;
    outstanding_debt: Prisma.Decimal;
  }) {
    return {
      mutuxWallet: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(wallet),
      },
    } as unknown as Prisma.TransactionClient;
  }

  it('passes when total limit can cover locked balance and outstanding debt', async () => {
    const tx = createTx({
      total_limit: new Prisma.Decimal(1000000),
      locked_balance: new Prisma.Decimal(400000),
      outstanding_debt: new Prisma.Decimal(100000),
    });

    await expect(
      service.checkCreditLineBalance(tx, 'wallet-id'),
    ).resolves.toBeUndefined();
  });

  it('throws LEDGER_IMBALANCE_ERROR when locked balance and outstanding debt exceed total limit', async () => {
    const tx = createTx({
      total_limit: new Prisma.Decimal(300000),
      locked_balance: new Prisma.Decimal(400000),
      outstanding_debt: new Prisma.Decimal(1),
    });

    await expect(
      service.checkCreditLineBalance(tx, 'wallet-id'),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'LEDGER_IMBALANCE_ERROR' },
    });
  });
});
