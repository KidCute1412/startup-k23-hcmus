import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';

@Controller()
export class WalletsController {
  constructor(private readonly service: WalletsService) {}
  @UseGuards(JwtAuthGuard) @Get('wallets/renter') get(@Req() req: any) { return this.service.getRenter(req.user.id); }
  @UseGuards(JwtAuthGuard) @Post('wallets/topups/checkout') checkout(@Req() req: any, @Body('amount') amount: number) { return this.service.checkout(req.user.id, Number(amount)); }
  @UseGuards(JwtAuthGuard) @Post('wallets/topups/:id/simulate-success') simulate(@Req() req: any, @Param('id') id: string) { return this.service.completeTopup(id, req.user.id); }
  @Post('payments/webhook/payos') webhook(@Body() body: any) { return this.service.webhook(body); }
}
