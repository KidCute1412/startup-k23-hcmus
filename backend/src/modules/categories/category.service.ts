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

  async findAll() {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.mapCategory(category));
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    return category ? this.mapCategory(category) : null;
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

  private mapCategory(category: GearCategory) {
    return {
      id: category.id,
      parentId: category.parent_id,
      name: category.name,
      slug: category.slug,
      description: category.description,
    };
  }
}
