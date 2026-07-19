import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GearCategory } from '@prisma/client';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    parentId?: string;
  }): Promise<GearCategory> {
    return this.prisma.gearCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId,
      },
    });
  }

  async findAll(): Promise<GearCategory[]> {
    return this.prisma.gearCategory.findMany();
  }

  async findById(id: string): Promise<GearCategory | null> {
    return this.prisma.gearCategory.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; parentId?: string },
  ): Promise<GearCategory> {
    return this.prisma.gearCategory.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        parent_id: data.parentId,
      },
    });
  }

  async delete(id: string): Promise<GearCategory> {
    return this.prisma.gearCategory.delete({ where: { id } });
  }
}
