import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { RejectDto } from './dto/reject.dto';
import type { AuthenticatedRequest } from '../../common/types/authentication';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.rejectGear(id, req.user.id);
  }
}
