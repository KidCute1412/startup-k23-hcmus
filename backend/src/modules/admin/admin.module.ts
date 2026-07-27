import { Module } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { EscrowModule } from '../escrow/escrow.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [EscrowModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
