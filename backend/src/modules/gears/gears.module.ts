import { Module } from '@nestjs/common';
import { GearsService } from './gears.service';
import { GearsController } from './gears.controller';
import { GearsRepository } from './gears.repository';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [GearsController],
  providers: [GearsService, GearsRepository],
  exports: [GearsService],
})
export class GearsModule {}
