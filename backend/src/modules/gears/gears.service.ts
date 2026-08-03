import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GearsRepository } from './gears.repository';
import { Gear } from '@prisma/client';
import { CreateGearDto } from './dto/create-gear.dto';
import { UpdateGearDto } from './dto/update-gear.dto';
import { GearCatalogSort } from './dto/get-gears-query.dto';
import { PublicGearDetailRecord, PublicGearRecord } from './gears.repository';
import { GetMyGearsQueryDto } from './dto/get-my-gears-query.dto';
import { MediaService } from '../media/media.service';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: GearCatalogSort;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

@Injectable()
export class GearsService {
  private readonly idempotencyKeys = new Map<string, Gear>();

  constructor(
    private readonly gearsRepository: GearsRepository,
    private readonly mediaService: MediaService = new MediaService(),
  ) {}

  async create(lenderId: string, data: CreateGearDto): Promise<Gear> {
    if (data.idempotencyKey) {
      const existing = this.idempotencyKeys.get(data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const lender = await this.gearsRepository.findUserById(lenderId);
    if (!lender || !lender.lender_enabled) {
      throw new ForbiddenException({
        error: 'LENDER_NOT_ENABLED',
        message: 'Lender enablement is required to create gears',
      });
    }
    if (lender.kyc_status !== 'verified') {
      throw new ForbiddenException({
        error: 'KYC_NOT_VERIFIED',
        message: 'Verified KYC is required to create gears',
      });
    }

    const imageUrls = data.imageUrls
      ? await Promise.all(
          data.imageUrls.map((url) =>
            this.mediaService.assertOwnedImageFile(lenderId, url),
          ),
        )
      : undefined;
    const mediaCreate =
      imageUrls && imageUrls.length > 0
        ? {
            create: imageUrls.map((url, index) => ({
              url,
              type: 'image',
              is_primary: index === 0,
              sort_order: index,
            })),
          }
        : undefined;

    const gear = await this.gearsRepository.create({
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
      media: mediaCreate,
    });

    if (data.idempotencyKey) {
      const key = data.idempotencyKey;
      this.idempotencyKeys.set(key, gear);
      setTimeout(
        () => {
          this.idempotencyKeys.delete(key);
        },
        10 * 60 * 1000,
      ); // 10 minutes cache
    }

    return gear;
  }

  async findAll(options: FindAllOptions) {
    const { page, limit } = options;
    const result = await this.gearsRepository.findAll(options);
    return {
      data: result.data.map((gear) => this.mapSummary(gear)),
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async findOne(id: string) {
    const gear = await this.gearsRepository.findById(id);
    if (!gear) throw new NotFoundException('Gear not found');
    return this.mapDetail(gear);
  }

  async findMine(
    lenderId: string,
    query: GetMyGearsQueryDto,
  ): Promise<PaginatedResult<ReturnType<GearsService['mapSummary']>>> {
    const lender = await this.gearsRepository.findUserById(lenderId);
    if (!lender?.lender_enabled) {
      throw new ForbiddenException({
        error: 'LENDER_NOT_ENABLED',
        message: 'Lender enablement is required to view lender gears',
      });
    }
    const result = await this.gearsRepository.findMine({
      lenderId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
    });
    return {
      data: result.data.map((gear) => this.mapSummary(gear)),
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  async update(
    id: string,
    lenderId: string,
    data: UpdateGearDto,
  ): Promise<Gear> {
    const lender = await this.gearsRepository.findUserById(lenderId);
    if (!lender?.lender_enabled) {
      throw new ForbiddenException({
        error: 'LENDER_NOT_ENABLED',
        message: 'Lender enablement is required to update gears',
      });
    }
    const gear = await this.gearsRepository.findByIdForLender(id, lenderId);
    if (!gear) throw new NotFoundException('Gear not found');

    const imageUrls = data.imageUrls
      ? await Promise.all(
          data.imageUrls.map((url) =>
            this.mediaService.assertOwnedImageFile(lenderId, url),
          ),
        )
      : undefined;

    return this.gearsRepository.updateWithMedia(id, {
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
    }, imageUrls);
  }

  async remove(id: string): Promise<Gear> {
    return this.gearsRepository.delete(id);
  }

  private mapSummary(gear: PublicGearRecord) {
    return {
      id: gear.id,
      lenderId: gear.lender_id,
      categoryId: gear.category_id,
      name: gear.name,
      brand: gear.brand,
      model: gear.model,
      description: gear.description,
      specifications: gear.specifications,
      value: gear.value === null ? null : Number(gear.value),
      rentPricePerDay: Number(gear.rent_price_per_day),
      status: gear.status,
      approvalStatus: gear.approval_status,
      createdAt: gear.created_at,
      updatedAt: gear.updated_at,
      category: gear.category
        ? {
            id: gear.category.id,
            parentId: gear.category.parent_id,
            name: gear.category.name,
            slug: gear.category.slug,
            description: gear.category.description,
          }
        : null,
      media: gear.media.map((media) => ({
        id: media.id,
        type: media.type,
        url: media.url,
        isPrimary: media.is_primary,
        sortOrder: media.sort_order,
      })),
      rating: gear.rating,
      reviewCount: gear.reviewCount,
      lender: {
        id: gear.lender.id,
        fullName: gear.lender.full_name,
        avatarUrl: gear.lender.avatar_url,
        rating: gear.lender.rating,
        totalReviews: gear.lender.total_reviews,
      },
    };
  }

  private mapDetail(gear: PublicGearDetailRecord) {
    return {
      ...this.mapSummary(gear),
      serialNumber: gear.serial_number,
      reviews: gear.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: {
          id: review.reviewer.id,
          fullName: review.reviewer.full_name,
          avatarUrl: review.reviewer.avatar_url,
        },
      })),
    };
  }
}
