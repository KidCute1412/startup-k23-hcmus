import { Injectable } from '@nestjs/common';
import { GearsRepository } from './gears.repository';
import { Gear } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  categoryId?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable()
export class GearsService {
  constructor(private readonly gearsRepository: GearsRepository) {}

  async create(data: any): Promise<Gear> {
    return this.gearsRepository.create(data);
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<Gear>> {
    const { page, limit, categoryId } = options;
    const result = await this.gearsRepository.findAll({ page, limit, categoryId });
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<Gear | null> {
    return this.gearsRepository.findById(id);
  }

  async update(id: string, data: any): Promise<Gear> {
    return this.gearsRepository.update(id, data);
  }

  async remove(id: string): Promise<Gear> {
    return this.gearsRepository.delete(id);
  }
}
