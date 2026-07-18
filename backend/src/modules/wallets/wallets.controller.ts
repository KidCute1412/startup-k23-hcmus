import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import type { PayosWebhookBody } from './wallets.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
  rawBody?: Buffer;
}

@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}
  @UseGuards(JwtAuthGuard) @Get('wallets/renter') get(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getRenter(req.user.id);
  }
  @UseGuards(JwtAuthGuard) @Post('wallets/topups/checkout') checkout(
    @Req() req: AuthenticatedRequest,
    @Body('amount') amount: number,
  ) {
    return this.service.checkout(req.user.id, Number(amount));
  }
  @UseGuards(JwtAuthGuard)
  @Post('wallets/topups/:id/simulate-success')
  simulate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.completeTopup(id, req.user.id);
  }
  @Post('payments/webhook/payos') webhook(
    @Body() body: PayosWebhookBody,
    @Headers('x-payos-signature') signature: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.webhook(body, signature, req.rawBody);
  }
}
