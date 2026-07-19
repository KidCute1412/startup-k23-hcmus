import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { GearCategory } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(data: {
    name: string;
    slug: string;
    parentId?: string;
  }): Promise<GearCategory> {
    return this.categoryRepository.create(data);
  }

  async findAll(): Promise<GearCategory[]> {
    return this.categoryRepository.findAll();
  }

  async findOne(id: string): Promise<GearCategory | null> {
    return this.categoryRepository.findById(id);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; parentId?: string },
  ): Promise<GearCategory> {
    return this.categoryRepository.update(id, data);
  }

  async delete(id: string): Promise<GearCategory> {
    return this.categoryRepository.delete(id);
  }
}
