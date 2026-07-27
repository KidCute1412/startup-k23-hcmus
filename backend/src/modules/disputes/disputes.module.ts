import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({
  imports: [MediaModule],
  controllers: [DisputesController],
  providers: [DisputesService],
})
export class DisputesModule {}
