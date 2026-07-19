import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EscrowService } from './escrow.service';

@Module({
  imports: [PrismaModule],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
