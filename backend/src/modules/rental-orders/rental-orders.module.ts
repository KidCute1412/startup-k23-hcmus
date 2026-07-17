import { Module } from '@nestjs/common';
import { RentalOrdersController } from './rental-orders.controller';
import { RentalOrdersRepository } from './rental-orders.repository';
import { RentalOrdersService } from './rental-orders.service';

@Module({
  controllers: [RentalOrdersController],
  providers: [RentalOrdersService, RentalOrdersRepository],
  exports: [RentalOrdersService],
})
export class RentalOrdersModule {}
