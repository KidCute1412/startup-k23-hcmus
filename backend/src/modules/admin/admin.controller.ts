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
}
