import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
}
