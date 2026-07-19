import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateTopupCheckoutDto } from './dto/create-topup-checkout.dto';
import { PayosWebhookDto } from './dto/payos-webhook.dto';

@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}
  @UseGuards(JwtAuthGuard)
  @Get('wallets/renter')
  get(@Req() req: AuthenticatedRequest) {
    return this.service.getRenter(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('wallets/topups/checkout')
  checkout(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTopupCheckoutDto,
  ) {
    return this.service.checkout(req.user.id, body.amount);
  }
  @UseGuards(JwtAuthGuard)
  @Post('wallets/topups/:id/simulate-success')
  simulate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.completeTopup(id, req.user.id);
  }
  @Post('payments/webhook/payos')
  webhook(@Body() body: PayosWebhookDto) {
    return this.service.webhook(body);
  }
}
