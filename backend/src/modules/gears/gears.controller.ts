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
import type { AuthenticatedRequest } from '../../common/types/authentication';
import { GetMyGearsQueryDto } from './dto/get-my-gears-query.dto';
import { GetGearsQueryDto } from './dto/get-gears-query.dto';

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
  async findAll(@Query() query: GetGearsQueryDto) {
    return this.gearsService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      category: query.category,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.resolvedSort,
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async findMine(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyGearsQueryDto,
  ): Promise<unknown> {
    return this.gearsService.findMine(req.user.id, query);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard)
  async findOneMine(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.gearsService.findOneMine(id, req.user.id);
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
