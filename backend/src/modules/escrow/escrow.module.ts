import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EscrowReconciliationService } from './escrow-reconciliation.service';
import { EscrowService } from './escrow.service';

@Module({
  imports: [PrismaModule],
  providers: [EscrowService, EscrowReconciliationService],
  exports: [EscrowService],
})
export class EscrowModule {}
