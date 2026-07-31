import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreditLimitsService } from './credit-limits.service';
import { CreateCreditLimitRequestDto } from './dto/create-credit-limit-request.dto';

@Controller('credit-limit-requests')
@UseGuards(JwtAuthGuard)
export class CreditLimitRequestsController {
  constructor(private readonly service: CreditLimitsService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCreditLimitRequestDto,
  ) {
    this.requireRenter(req);
    return this.service.createRequest(req.user.id, dto);
  }

  @Get('me')
  mine(@Req() req: AuthenticatedRequest) {
    this.requireRenter(req);
    return this.service.getMine(req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    this.requireRenter(req);
    return this.service.cancelRequest(req.user.id, id);
  }

  private requireRenter(req: AuthenticatedRequest) {
    if (req.user.role !== 'renter') {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only renters can manage credit limit requests',
      });
    }
  }
}
