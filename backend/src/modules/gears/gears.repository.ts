import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gear } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  categoryId?: string;
}

@Injectable()
export class GearsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<Gear> {
    return this.prisma.gear.create({ data });
  }

  async findAll(options: FindAllOptions): Promise<{ data: Gear[]; total: number }> {
    const { page, limit, categoryId } = options;
    const where = categoryId ? { category_id: categoryId } : {};
    const [data, total] = await Promise.all([
      this.prisma.gear.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.gear.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Gear | null> {
    return this.prisma.gear.findUnique({ where: { id } });
  }

  async update(id: string, data: any): Promise<Gear> {
    return this.prisma.gear.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Gear> {
    return this.prisma.gear.delete({ where: { id } });
  }
}
