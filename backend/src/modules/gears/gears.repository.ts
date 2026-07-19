import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gear, Prisma } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  categoryId?: string;
}

@Injectable()
export class GearsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GearUncheckedCreateInput): Promise<Gear> {
    return this.prisma.gear.create({ data });
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: Gear[]; total: number }> {
    const { page, limit, categoryId } = options;
    const where = {
      approval_status: 'approved' as const,
      status: 'available' as const,
      ...(categoryId ? { category_id: categoryId } : {}),
    };
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
    return this.prisma.gear.findFirst({
      where: { id, approval_status: 'approved', status: 'available' },
    });
  }

  async findByIdForLender(id: string, lenderId: string): Promise<Gear | null> {
    return this.prisma.gear.findFirst({ where: { id, lender_id: lenderId } });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.GearUncheckedUpdateInput,
  ): Promise<Gear> {
    return this.prisma.gear.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Gear> {
    return this.prisma.gear.delete({ where: { id } });
  }
}
