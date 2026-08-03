import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateTopupCheckoutDto } from './dto/create-topup-checkout.dto';
import { PayosWebhookDto } from './dto/payos-webhook.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}
  @UseGuards(JwtAuthGuard)
  @Get('wallets/renter')
  get(@Req() req: AuthenticatedRequest) {
    this.requireRole(req, 'renter');
    return this.service.getRenter(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('wallets/mutux')
  getMutux(@Req() req: AuthenticatedRequest) {
    this.requireRole(req, 'renter');
    return this.service.getMutux(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallets/mutux/debt/repay')
  @HttpCode(200)
  repayMutuxDebt(@Req() req: AuthenticatedRequest) {
    this.requireRole(req, 'renter');
    return this.service.repayMutuxDebt(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('wallets/lender')
  getLender(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(20)) limit: number,
  ) {
    return this.service.getLender(req.user.id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallets/lender/withdraw')
  @HttpCode(200)
  withdraw(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateWithdrawalDto,
  ) {
    return this.service.withdraw(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallets/topups/checkout')
  checkout(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTopupCheckoutDto,
  ) {
    this.requireRole(req, 'renter');
    return this.service.checkout(req.user.id, body.amount, body.method);
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallets/topups/:id/simulate-success')
  @HttpCode(200)
  simulate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.requireRole(req, 'renter');
    return this.service.completeTopup(id, req.user.id);
  }

  @Post('payments/webhook/payos')
  @HttpCode(200)
  webhook(
    @Body() body: PayosWebhookDto,
    @Headers('x-payos-signature') signature: string | undefined,
  ) {
    return this.service.webhook(body, signature);
  }

  private requireRole(
    req: AuthenticatedRequest,
    expectedRole: 'renter' | 'lender',
  ): void {
    if (req.user.role !== expectedRole) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: `Only ${expectedRole}s can use this wallet operation`,
      });
    }
  }
}
