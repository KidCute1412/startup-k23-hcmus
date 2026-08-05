import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformFinanceService } from './platform-finance.service';

@Module({
  imports: [PrismaModule],
  providers: [PlatformFinanceService],
  exports: [PlatformFinanceService],
})
export class PlatformFinanceModule {}
