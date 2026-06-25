import { Module } from '@nestjs/common';
import { GearsService } from './gears.service';
import { GearsController } from './gears.controller';
import { GearsRepository } from './gears.repository';

@Module({
  controllers: [GearsController],
  providers: [GearsService, GearsRepository],
  exports: [GearsService],
})
export class GearsModule {}
