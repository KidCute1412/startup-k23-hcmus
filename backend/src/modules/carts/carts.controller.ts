import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CartsService } from './carts.service';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  get(@Req() req: AuthenticatedRequest) {
    return this.cartsService.get(req.user);
  }

  @Put('items/:gearId')
  @HttpCode(200)
  upsert(
    @Req() req: AuthenticatedRequest,
    @Param('gearId') gearId: string,
    @Body() dto: UpsertCartItemDto,
  ) {
    return this.cartsService.upsert(req.user, gearId, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(200)
  remove(@Req() req: AuthenticatedRequest, @Param('itemId') itemId: string) {
    return this.cartsService.remove(req.user, itemId);
  }

  @Delete()
  @HttpCode(200)
  clear(@Req() req: AuthenticatedRequest) {
    return this.cartsService.clear(req.user);
  }
}
