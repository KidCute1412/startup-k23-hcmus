import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformFinanceModule } from '../finance/platform-finance.module';
import { EscrowReconciliationService } from './escrow-reconciliation.service';
import { EscrowService } from './escrow.service';

@Module({
  imports: [PrismaModule, PlatformFinanceModule],
  providers: [EscrowService, EscrowReconciliationService],
  exports: [EscrowService],
})
export class EscrowModule {}
