import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { RejectDto } from './dto/reject.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { GetGearQueueQueryDto } from './dto/get-gear-queue-query.dto';
import { GetKycQueueQueryDto } from './dto/get-kyc-queue-query.dto';
import { GetDisputeQueueQueryDto } from './dto/get-dispute-queue-query.dto';
import { GetLenderUpgradeRequestsQueryDto } from './dto/get-lender-upgrade-requests-query.dto';
import { RejectLenderUpgradeRequestDto } from './dto/reject-lender-upgrade-request.dto';
import { CloseDisputeDto } from './dto/close-dispute.dto';
import { GetDashboardAnalyticsQueryDto } from './dto/get-dashboard-analytics-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('kyc')
  getKycQueue(@Query() query: GetKycQueueQueryDto) {
    return this.adminService.getKycQueue(query);
  }

  @Get('gears')
  getGearQueue(@Query() query: GetGearQueueQueryDto) {
    return this.adminService.getGearQueue(query);
  }

  @Get('disputes')
  getDisputeQueue(@Query() query: GetDisputeQueueQueryDto) {
    return this.adminService.getDisputeQueue(query);
  }

  @Get('dashboard/analytics')
  getDashboardAnalytics(@Query() query: GetDashboardAnalyticsQueryDto) {
    return this.adminService.getDashboardAnalytics(query);
  }

  @Get('lender-upgrade-requests')
  getLenderUpgradeRequests(@Query() query: GetLenderUpgradeRequestsQueryDto) {
    return this.adminService.getLenderUpgradeRequests(query);
  }

  @Post('kyc/:id/approve')
  approveKyc(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.approveKyc(id, req.user.id);
  }

  @Post('kyc/:id/reject')
  rejectKyc(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.rejectKyc(id, req.user.id, dto.reason);
  }

  @Post('gears/:id/approve')
  approveGear(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.approveGear(id, req.user.id);
  }

  @Post('gears/:id/reject')
  rejectGear(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.rejectGear(id, req.user.id);
  }

  @Post('lender-upgrade-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveLenderUpgradeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.approveLenderUpgradeRequest(id, req.user.id);
  }

  @Post('lender-upgrade-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectLenderUpgradeRequest(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectLenderUpgradeRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.rejectLenderUpgradeRequest(
      id,
      req.user.id,
      dto.reviewNote,
    );
  }

  @Post('disputes/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveDisputeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.resolveDispute(
      id,
      req.user.id,
      dto.resolutionType,
      dto.deductAmount,
      dto.resolutionNote,
    );
  }

  @Post('disputes/:id/start-review')
  @HttpCode(HttpStatus.OK)
  startDisputeReview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.startDisputeReview(id, req.user.id);
  }

  @Post('disputes/:id/close')
  @HttpCode(HttpStatus.OK)
  closeDispute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CloseDisputeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.closeDispute(id, req.user.id, dto.closeNote);
  }
}
