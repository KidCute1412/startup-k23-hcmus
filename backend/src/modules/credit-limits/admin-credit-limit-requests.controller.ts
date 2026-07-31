import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreditLimitsService } from './credit-limits.service';
import { ApproveCreditLimitRequestDto } from './dto/approve-credit-limit-request.dto';
import { GetCreditLimitRequestsQueryDto } from './dto/get-credit-limit-requests-query.dto';
import { RejectCreditLimitRequestDto } from './dto/reject-credit-limit-request.dto';

@Controller('admin/credit-limit-requests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCreditLimitRequestsController {
  constructor(private readonly service: CreditLimitsService) {}

  @Get()
  list(@Query() query: GetCreditLimitRequestsQueryDto) {
    return this.service.listRequests(query);
  }

  @Post(':id/review')
  @HttpCode(200)
  review(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.startReview(id, req.user.id);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveCreditLimitRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.approveRequest(id, req.user.id, dto);
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectCreditLimitRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.rejectRequest(id, req.user.id, dto.reviewNote);
  }
}
