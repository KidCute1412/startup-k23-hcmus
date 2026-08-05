import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateRentalProofDto } from './dto/create-rental-proof.dto';
import { CreateRentalProofBatchDto } from './dto/create-rental-proof-batch.dto';
import { RentalProofsService } from './rental-proofs.service';

@UseGuards(JwtAuthGuard)
@Controller('rental-orders/:id/proofs')
export class RentalProofsController {
  constructor(private readonly rentalProofsService: RentalProofsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: AuthenticatedRequest,
    @Param('id') rentalOrderId: string,
    @Body() dto: CreateRentalProofDto,
  ) {
    return this.rentalProofsService.create(request.user.id, rentalOrderId, dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  createBatch(
    @Req() request: AuthenticatedRequest,
    @Param('id') rentalOrderId: string,
    @Body() dto: CreateRentalProofBatchDto,
  ) {
    return this.rentalProofsService.createBatch(
      request.user.id,
      rentalOrderId,
      dto,
    );
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Param('id') rentalOrderId: string,
  ) {
    return this.rentalProofsService.findAll(request.user.id, rentalOrderId);
  }
}
