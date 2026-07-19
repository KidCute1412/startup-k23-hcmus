import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GearsRepository } from './gears.repository';
import { Gear } from '@prisma/client';
import { CreateGearDto } from './dto/create-gear.dto';
import { UpdateGearDto } from './dto/update-gear.dto';

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

  async create(lenderId: string, data: CreateGearDto): Promise<Gear> {
    const lender = await this.gearsRepository.findUserById(lenderId);
    if (!lender || lender.role !== 'lender') {
      throw new ForbiddenException({
        error: 'LENDER_ONLY',
        message: 'Only lenders can create gears',
      });
    }
    if (lender.kyc_status !== 'verified') {
      throw new ForbiddenException({
        error: 'KYC_NOT_VERIFIED',
        message: 'Verified KYC is required to create gears',
      });
    }

    return this.gearsRepository.create({
      lender_id: lenderId,
      category_id: data.categoryId,
      name: data.name,
      brand: data.brand,
      model: data.model,
      serial_number: data.serialNumber,
      description: data.description,
      specifications: data.specifications,
      value: data.value,
      rent_price_per_day: data.rentPricePerDay,
      approval_status: 'pending',
    });
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResult<Gear>> {
    const { page, limit, categoryId } = options;
    const result = await this.gearsRepository.findAll({
      page,
      limit,
      categoryId,
    });
    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<Gear> {
    const gear = await this.gearsRepository.findById(id);
    if (!gear) throw new NotFoundException('Gear not found');
    return gear;
  }

  async update(
    id: string,
    lenderId: string,
    data: UpdateGearDto,
  ): Promise<Gear> {
    const gear = await this.gearsRepository.findByIdForLender(id, lenderId);
    if (!gear) throw new NotFoundException('Gear not found');

    return this.gearsRepository.update(id, {
      ...(data.categoryId !== undefined
        ? { category_id: data.categoryId }
        : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.brand !== undefined ? { brand: data.brand } : {}),
      ...(data.model !== undefined ? { model: data.model } : {}),
      ...(data.serialNumber !== undefined
        ? { serial_number: data.serialNumber }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.specifications !== undefined
        ? { specifications: data.specifications }
        : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.rentPricePerDay !== undefined
        ? { rent_price_per_day: data.rentPricePerDay }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(gear.approval_status === 'approved'
        ? { approval_status: 'pending', approved_by: null, approved_at: null }
        : {}),
    });
  }

  async remove(id: string): Promise<Gear> {
    return this.gearsRepository.delete(id);
  }
}
