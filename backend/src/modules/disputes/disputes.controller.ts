import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateDisputeResponseDto } from './dto/create-dispute-response.dto';
import { DisputesService } from './disputes.service';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(request.user.id, dto);
  }

  @Post(':id/evidence')
  @HttpCode(HttpStatus.CREATED)
  addResponseEvidence(
    @Req() request: AuthenticatedRequest,
    @Param('id') disputeId: string,
    @Body() dto: CreateDisputeResponseDto,
  ) {
    return this.disputesService.addResponseEvidence(
      request.user.id,
      disputeId,
      dto,
    );
  }
}
