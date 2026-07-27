import { Module } from '@nestjs/common';
import { EscrowModule } from '../escrow/escrow.module';
import { RentalOrdersController } from './rental-orders.controller';
import { RentalOrdersRepository } from './rental-orders.repository';
import { RentalOrdersService } from './rental-orders.service';
import { MediaModule } from '../media/media.module';
import { RentalProofsController } from './rental-proofs.controller';
import { RentalProofsService } from './rental-proofs.service';

@Module({
  imports: [EscrowModule, MediaModule],
  controllers: [RentalOrdersController, RentalProofsController],
  providers: [RentalOrdersService, RentalOrdersRepository, RentalProofsService],
  exports: [RentalOrdersService],
})
export class RentalOrdersModule {}
