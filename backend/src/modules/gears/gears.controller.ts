import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { GearsService } from './gears.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('gears')
export class GearsController {
  constructor(private readonly gearsService: GearsService) {}

  @Post()
  //@UseGuards(JwtAuthGuard)
  async create(@Body() createGearDto: any) {
    return this.gearsService.create(createGearDto);
  }

  @Get()
  async findAll(@Query('page') page = '1', @Query('limit') limit = '10', @Query('categoryId') categoryId?: string): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.gearsService.findAll({ page: pageNum, limit: limitNum, categoryId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.gearsService.findOne(id);
  }

  @Patch(':id')
  //@UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateGearDto: any) {
    return this.gearsService.update(id, updateGearDto);
  }

  @Delete(':id')
  //@UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.gearsService.remove(id);
  }
}
