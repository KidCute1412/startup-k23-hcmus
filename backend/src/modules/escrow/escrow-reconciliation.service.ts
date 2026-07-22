import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class EscrowReconciliationService {
  async checkCreditLineBalance(
    tx: Prisma.TransactionClient,
    mutuxWalletId: string,
  ): Promise<void> {
    const wallet = await tx.mutuxWallet.findUniqueOrThrow({
      where: { id: mutuxWalletId },
      select: {
        total_limit: true,
        locked_balance: true,
        outstanding_debt: true,
      },
    });
    const availableCredit = wallet.total_limit
      .minus(wallet.locked_balance)
      .minus(wallet.outstanding_debt);

    if (availableCredit.lessThan(0)) {
      throw new BadRequestException({
        error: 'LEDGER_IMBALANCE_ERROR',
        message: 'LEDGER_IMBALANCE_ERROR',
      });
    }
  }
}
