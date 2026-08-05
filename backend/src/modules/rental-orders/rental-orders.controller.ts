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
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import { GetRentalOrdersQueryDto } from './dto/get-rental-orders-query.dto';
import { RentalOrdersService } from './rental-orders.service';
import { CreateBatchRentalOrdersDto } from './dto/create-batch-rental-orders.dto';
import { TransitionWithProofDto } from './dto/transition-with-proof.dto';

@UseGuards(JwtAuthGuard)
@Controller('rental-orders')
export class RentalOrdersController {
  constructor(private readonly rentalOrdersService: RentalOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRentalOrderDto) {
    this.assertRenter(req);
    return this.rentalOrdersService.createLocked(req.user.id, dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  createBatch(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBatchRentalOrdersDto,
  ) {
    this.assertRenter(req);
    return this.rentalOrdersService.createBatch(req.user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetRentalOrdersQueryDto,
  ) {
    return this.rentalOrdersService.findAll(req.user, query);
  }

  @Get('financial-summary')
  financialSummary(@Req() req: AuthenticatedRequest) {
    this.assertRenter(req);
    return this.rentalOrdersService.getFinancialSummary(req.user.id);
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
  confirmReceipt(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: TransitionWithProofDto,
  ) {
    return this.rentalOrdersService.confirmReceiptWithProof(
      req.user.id,
      id,
      dto.fileUrls,
      dto.note,
    );
  }

  @Patch(':id/return')
  returnOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: TransitionWithProofDto,
  ) {
    return this.rentalOrdersService.returnWithProof(
      req.user.id,
      id,
      dto.fileUrls,
      dto.note,
    );
  }

  @Patch(':id/confirm-return')
  confirmReturn(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.rentalOrdersService.confirmReturn(req.user.id, id);
  }

  private assertRenter(req: AuthenticatedRequest) {
    if (req.user.role !== UserRole.renter) {
      throw new ForbiddenException({
        error: 'RENTER_ONLY',
        message: 'Only renters can create rental orders',
      });
    }
  }
}
