import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GearsService } from './gears.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateGearDto } from './dto/create-gear.dto';
import { UpdateGearDto } from './dto/update-gear.dto';
import { Gear } from '@prisma/client';
import type { AuthenticatedRequest } from '../../common/types/authentication';

interface GearListResponse {
  data: Gear[];
  meta: { total: number; page: number; limit: number };
}

@Controller('gears')
export class GearsController {
  constructor(private readonly gearsService: GearsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createGearDto: CreateGearDto,
  ) {
    return this.gearsService.create(req.user.id, createGearDto);
  }

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('categoryId') categoryId?: string,
  ): Promise<GearListResponse> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.gearsService.findAll({
      page: pageNum,
      limit: limitNum,
      categoryId,
    });
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.gearsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateGearDto: UpdateGearDto,
  ) {
    return this.gearsService.update(id, req.user.id, updateGearDto);
  }

  @Delete(':id')
  //@UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.gearsService.remove(id);
  }
}
