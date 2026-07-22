import { Module } from '@nestjs/common';
import { EscrowModule } from '../escrow/escrow.module';
import { RentalOrdersController } from './rental-orders.controller';
import { RentalOrdersRepository } from './rental-orders.repository';
import { RentalOrdersService } from './rental-orders.service';

@Module({
  imports: [EscrowModule],
  controllers: [RentalOrdersController],
  providers: [RentalOrdersService, RentalOrdersRepository],
  exports: [RentalOrdersService],
})
export class RentalOrdersModule {}
