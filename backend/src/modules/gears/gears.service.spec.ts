import 'reflect-metadata';
import { Decimal } from '@prisma/client/runtime/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GearCatalogSort, GetGearsQueryDto } from './dto/get-gears-query.dto';
import { GearsRepository } from './gears.repository';
import { GearsService } from './gears.service';

describe('GearsService', () => {
  const findAll = jest.fn();
  const findById = jest.fn();
  const findMine = jest.fn();
  const findUserById = jest.fn();
  const repository = {
    findAll,
    findById,
    findMine,
    findUserById,
  } as unknown as GearsRepository;
  const service = new GearsService(repository);

  const record = {
    id: 'gear-id',
    lender_id: 'lender-id',
    category_id: 'category-id',
    name: 'Logitech G Pro',
    brand: 'Logitech',
    model: 'G Pro',
    description: 'Mouse',
    specifications: { dpi: 25000 },
    value: new Decimal(2_000_000),
    rent_price_per_day: new Decimal(100_000),
    status: 'available',
    approval_status: 'approved',
    created_at: new Date('2026-07-01'),
    updated_at: new Date('2026-07-02'),
    rating: 4.5,
    reviewCount: 2,
    category: {
      id: 'category-id',
      parent_id: 'parent-id',
      name: 'Mice',
      slug: 'mice',
      description: null,
    },
    media: [
      {
        id: 'media-id',
        type: 'image',
        url: '/mouse.jpg',
        is_primary: true,
        sort_order: 0,
      },
    ],
    lender: {
      id: 'lender-id',
      full_name: 'Safe Lender',
      avatar_url: null,
      rating: 4.8,
      total_reviews: 10,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findUserById.mockResolvedValue({
      id: 'lender-id',
      lender_enabled: true,
      kyc_status: 'verified',
    });
  });

  it('forwards catalog queries and maps a safe camelCase paginated response', async () => {
    findAll.mockResolvedValue({ data: [record], total: 13 });
    const query = {
      page: 2,
      limit: 12,
      search: 'logtech',
      categoryId: 'category-id',
      minPrice: 10,
      maxPrice: 200_000,
      sort: GearCatalogSort.relevance,
    };
    const result = await service.findAll(query);
    expect(findAll).toHaveBeenCalledWith(query);
    expect(result.meta).toEqual({
      total: 13,
      page: 2,
      limit: 12,
      totalPages: 2,
    });
    expect(result.data[0]).toMatchObject({
      lenderId: 'lender-id',
      categoryId: 'category-id',
      value: 2_000_000,
      rentPricePerDay: 100_000,
      rating: 4.5,
      reviewCount: 2,
      category: { parentId: 'parent-id' },
      media: [{ isPrimary: true, sortOrder: 0 }],
      lender: {
        id: 'lender-id',
        fullName: 'Safe Lender',
        totalReviews: 10,
      },
    });
    expect(result.data[0].lender).not.toHaveProperty('password_hash');
  });

  it('maps detail serial number and safe reviewer fields', async () => {
    findById.mockResolvedValue({
      ...record,
      serial_number: 'SERIAL',
      reviews: [
        {
          id: 'review-id',
          rating: 5,
          comment: 'Great',
          created_at: new Date('2026-07-03'),
          reviewer: {
            id: 'reviewer-id',
            full_name: 'Reviewer',
            avatar_url: null,
          },
        },
      ],
    });
    await expect(service.findOne('gear-id')).resolves.toMatchObject({
      serialNumber: 'SERIAL',
      reviews: [
        {
          reviewer: { id: 'reviewer-id', fullName: 'Reviewer' },
        },
      ],
    });
  });

  it('returns every gear state scoped to the authenticated lender', async () => {
    const gears = [
      { id: 'pending', approval_status: 'pending', status: 'available' },
      { id: 'rejected', approval_status: 'rejected', status: 'available' },
    ];
    findMine.mockResolvedValue({ data: gears, total: 2 });
    await expect(service.findMine('lender-id', 1, 2)).resolves.toEqual({
      data: gears,
      meta: { total: 2, page: 1, limit: 2, totalPages: 1 },
    });
  });
});

describe('GetGearsQueryDto', () => {
  it('selects relevance for search and newest without search', () => {
    expect(
      plainToInstance(GetGearsQueryDto, { search: ' logtech ' }).resolvedSort,
    ).toBe(GearCatalogSort.relevance);
    expect(plainToInstance(GetGearsQueryDto, {}).resolvedSort).toBe(
      GearCatalogSort.newest,
    );
  });

  it('rejects an inverted price range', async () => {
    const dto = plainToInstance(GetGearsQueryDto, {
      minPrice: '200',
      maxPrice: '100',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('treats blank optional filters as absent', async () => {
    const dto = plainToInstance(GetGearsQueryDto, {
      search: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sort: '',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({ page: 1, limit: 10 });
    expect(dto.search).toBeUndefined();
    expect(dto.categoryId).toBeUndefined();
    expect(dto.minPrice).toBeUndefined();
    expect(dto.maxPrice).toBeUndefined();
    expect(dto.sort).toBeUndefined();
  });

  it('transforms placeholder or non-UUID strings to undefined cleanly', async () => {
    const dto = plainToInstance(GetGearsQueryDto, {
      categoryId: 'all',
      sort: 'default',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.categoryId).toBeUndefined();
    expect(dto.sort).toBeUndefined();
  });
});
