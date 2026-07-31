import { Module } from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminCreditLimitRequestsController } from './admin-credit-limit-requests.controller';
import { CreditLimitRequestsController } from './credit-limit-requests.controller';
import { CreditLimitsService } from './credit-limits.service';

@Module({
  controllers: [
    CreditLimitRequestsController,
    AdminCreditLimitRequestsController,
  ],
  providers: [CreditLimitsService, AdminGuard],
  exports: [CreditLimitsService],
})
export class CreditLimitsModule {}
