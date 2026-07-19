import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { GearCategory } from '@prisma/client';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(
    @Body() data: { name: string; slug: string; parentId?: string },
  ): Promise<GearCategory> {
    return this.categoryService.create(data);
  }

  @Get()
  async findAll(): Promise<GearCategory[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GearCategory | null> {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { name?: string; slug?: string; parentId?: string },
  ): Promise<GearCategory> {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<GearCategory> {
    return this.categoryService.delete(id);
  }
}
