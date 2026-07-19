import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import { GetRentalOrdersQueryDto } from './dto/get-rental-orders-query.dto';
import { RentalOrdersService } from './rental-orders.service';

@UseGuards(JwtAuthGuard)
@Controller('rental-orders')
export class RentalOrdersController {
  constructor(private readonly rentalOrdersService: RentalOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRentalOrderDto) {
    return this.rentalOrdersService.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetRentalOrdersQueryDto,
  ) {
    return this.rentalOrdersService.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.findOne(req.user, id);
  }

  @Patch(':id/confirm')
  confirm(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.confirm(req.user.id, id);
  }

  @Patch(':id/ship')
  ship(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.ship(req.user.id, id);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.cancel(req.user.id, id);
  }

  @Patch(':id/confirm-receipt')
  confirmReceipt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.confirmReceipt(req.user.id, id);
  }

  @Patch(':id/return')
  returnOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.returnOrder(req.user.id, id);
  }

  @Patch(':id/confirm-return')
  confirmReturn(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.confirmReturn(req.user.id, id);
  }
}
