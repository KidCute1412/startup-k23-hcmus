/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { createFixtureIds, createIntegrationApp } from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Public gear catalog (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const { ids, newId } = createFixtureIds();
  let lenderId: string;
  let renterId: string;
  let parentId: string;
  let childId: string;
  let logitechId: string;
  let keychronId: string;
  let hyperxId: string;
  const orderIds: string[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    ({ app, prisma } = await createIntegrationApp());
    lenderId = newId();
    renterId = newId();
    parentId = newId();
    childId = newId();
    logitechId = newId();
    keychronId = newId();
    hyperxId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: lenderId,
          email: `catalog-lender-${lenderId}@test.local`,
          password_hash: 'must-not-leak',
          full_name: 'Catalog Lender',
          phone: '0900000000',
          cccd: '012345678901',
          address: 'secret address',
          role: 'renter',
          lender_enabled: true,
          kyc_status: 'verified',
        },
        {
          id: renterId,
          email: `catalog-renter-${renterId}@test.local`,
          password_hash: 'must-not-leak',
          full_name: 'Catalog Reviewer',
          role: 'renter',
          kyc_status: 'verified',
        },
      ],
    });
    await prisma.gearCategory.create({
      data: {
        id: parentId,
        name: 'Peripherals',
        slug: `peripherals-${parentId}`,
      },
    });
    await prisma.gearCategory.create({
      data: {
        id: childId,
        parent_id: parentId,
        name: 'Keyboards',
        slug: `keyboards-${childId}`,
      },
    });
    await prisma.gear.createMany({
      data: [
        {
          id: logitechId,
          lender_id: lenderId,
          category_id: parentId,
          name: 'Logitech G Pro',
          brand: 'Logitech',
          model: 'G Pro',
          description: 'Wireless mouse',
          rent_price_per_day: 100_000,
          approval_status: 'approved',
          status: 'available',
          created_at: new Date('2026-07-01'),
        },
        {
          id: keychronId,
          lender_id: lenderId,
          category_id: childId,
          name: 'Keychron Q1',
          brand: 'Keychron',
          model: 'Q1',
          description: 'Custom mechanical keyboard',
          rent_price_per_day: 80_000,
          approval_status: 'approved',
          status: 'available',
          created_at: new Date('2026-07-02'),
        },
        {
          id: hyperxId,
          lender_id: lenderId,
          category_id: parentId,
          name: 'HyperX Cloud III',
          brand: 'HyperX',
          model: 'Cloud III',
          rent_price_per_day: 120_000,
          approval_status: 'approved',
          status: 'available',
          created_at: new Date('2026-07-03'),
        },
        {
          id: newId(),
          lender_id: lenderId,
          name: 'Hidden pending',
          rent_price_per_day: 1,
          approval_status: 'pending',
          status: 'available',
        },
        {
          id: newId(),
          lender_id: lenderId,
          name: 'Hidden rented',
          rent_price_per_day: 1,
          approval_status: 'approved',
          status: 'rented',
        },
        {
          id: newId(),
          lender_id: lenderId,
          name: 'Hidden rejected',
          rent_price_per_day: 1,
          approval_status: 'rejected',
          status: 'available',
        },
        {
          id: newId(),
          lender_id: lenderId,
          name: 'Hidden delisted',
          rent_price_per_day: 1,
          approval_status: 'approved',
          status: 'delisted',
        },
      ],
    });
    await prisma.gearMedia.createMany({
      data: [
        {
          id: newId(),
          gear_id: logitechId,
          type: 'image',
          url: '/second.jpg',
          sort_order: 2,
        },
        {
          id: newId(),
          gear_id: logitechId,
          type: 'image',
          url: '/primary.jpg',
          is_primary: true,
          sort_order: 5,
        },
      ],
    });
    const logitechOrderId = newId();
    const keychronOrderId = newId();
    const lenderReviewOrderId = newId();
    orderIds.push(logitechOrderId, keychronOrderId, lenderReviewOrderId);
    await prisma.rentalOrder.createMany({
      data: [
        [logitechOrderId, logitechId, 'CAT-LOGITECH'],
        [keychronOrderId, keychronId, 'CAT-KEYCHRON'],
        [lenderReviewOrderId, logitechId, 'CAT-LENDER'],
      ].map(([id, gearId, orderCode]) => ({
        id,
        order_code: `${orderCode}-${id}`,
        renter_id: renterId,
        gear_id: gearId,
        lender_id: lenderId,
        start_date: new Date('2026-06-01'),
        end_date: new Date('2026-06-02'),
        duration_days: 1,
        snapped_rent_price_per_day: 100_000,
        rental_fee: 100_000,
        deposit_amount: 500_000,
        status: 'completed' as const,
      })),
    });
    await prisma.review.createMany({
      data: [
        {
          id: newId(),
          rental_order_id: logitechOrderId,
          reviewer_id: renterId,
          target_gear_id: logitechId,
          target_type: 'gear',
          rating: 5,
          comment: 'Excellent mouse',
          created_at: new Date('2026-07-10'),
        },
        {
          id: newId(),
          rental_order_id: keychronOrderId,
          reviewer_id: renterId,
          target_gear_id: keychronId,
          target_type: 'gear',
          rating: 3,
          comment: 'Solid keyboard',
          created_at: new Date('2026-07-09'),
        },
        {
          id: newId(),
          rental_order_id: lenderReviewOrderId,
          reviewer_id: renterId,
          target_user_id: lenderId,
          target_gear_id: logitechId,
          target_type: 'lender',
          rating: 1,
          comment: 'This is not a gear review',
          created_at: new Date('2026-07-11'),
        },
      ],
    });
  });

  it('has pg_trgm and finds typo, substring, and short queries', async () => {
    const extension = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'
    `;
    expect(extension).toEqual([{ extname: 'pg_trgm' }]);
    for (const [query, id] of [
      ['logtech', logitechId],
      ['keycron', keychronId],
      ['hyper', hyperxId],
      ['Q1', keychronId],
    ]) {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/gears?search=${query}`)
        .expect(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ id })]),
      );
    }
  });

  it('filters descendants, prices, pagination and deterministic sorts', async () => {
    const descendants = await request(app.getHttpServer())
      .get(`/api/v1/gears?categoryId=${parentId}&sort=priceAsc&limit=2&page=1`)
      .expect(200);
    expect(descendants.body.meta).toMatchObject({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
    expect(
      descendants.body.data.map((gear: { id: string }) => gear.id),
    ).toEqual([keychronId, logitechId]);
    const descending = await request(app.getHttpServer())
      .get(`/api/v1/gears?categoryId=${parentId}&sort=priceDesc`)
      .expect(200);
    expect(descending.body.data.map((gear: { id: string }) => gear.id)).toEqual(
      [hyperxId, logitechId, keychronId],
    );
    const bounded = await request(app.getHttpServer())
      .get('/api/v1/gears?minPrice=90000&maxPrice=110000')
      .expect(200);
    expect(bounded.body.data.map((gear: { id: string }) => gear.id)).toEqual([
      logitechId,
    ]);
  });

  it('sorts by gear-only rating and excludes lender-targeted reviews', async () => {
    const sorted = await request(app.getHttpServer())
      .get('/api/v1/gears?sort=ratingDesc')
      .expect(200);
    expect(sorted.body.data.map((gear: { id: string }) => gear.id)).toEqual([
      logitechId,
      keychronId,
      hyperxId,
    ]);
    expect(sorted.body.data[0]).toMatchObject({ rating: 5, reviewCount: 1 });
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/gears/${logitechId}`)
      .expect(200);
    expect(detail.body.data.reviews).toHaveLength(1);
    expect(detail.body.data.reviews[0]).toMatchObject({
      rating: 5,
      comment: 'Excellent mouse',
      reviewer: {
        id: renterId,
        fullName: 'Catalog Reviewer',
        avatarUrl: null,
      },
    });
  });

  it('returns safe camelCase list/detail/category shapes and public 404s', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/gears?sort=newest')
      .expect(200);
    expect(list.body.data.map((gear: { id: string }) => gear.id)).toEqual([
      hyperxId,
      keychronId,
      logitechId,
    ]);
    expect(list.body.data[0]).toHaveProperty('rentPricePerDay');
    expect(list.body.data[0]).not.toHaveProperty('rent_price_per_day');
    expect(list.body.data[0].lender).toEqual({
      id: lenderId,
      fullName: 'Catalog Lender',
      avatarUrl: null,
      rating: 0,
      totalReviews: 0,
    });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/gears/${logitechId}`)
      .expect(200);
    expect(
      detail.body.data.media.map((item: { url: string }) => item.url),
    ).toEqual(['/primary.jpg', '/second.jpg']);
    expect(detail.body.data).toHaveProperty('serialNumber');
    await request(app.getHttpServer())
      .get(`/api/v1/gears/${newId()}`)
      .expect(404);

    const categories = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200);
    expect(categories.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: childId, parentId }),
      ]),
    );
    expect(
      categories.body.data.find((item: { id: string }) => item.id === childId),
    ).not.toHaveProperty('parent_id');
  });

  it('rejects invalid price ranges with the validation contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/gears?minPrice=200&maxPrice=100')
      .expect(400);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.review.deleteMany({
        where: { rental_order_id: { in: orderIds } },
      });
      await prisma.rentalOrder.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.gearMedia.deleteMany({ where: { gear_id: { in: ids } } });
      await prisma.gear.deleteMany({ where: { id: { in: ids } } });
      await prisma.gearCategory.deleteMany({ where: { id: childId } });
      await prisma.gearCategory.deleteMany({ where: { id: parentId } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await app?.close();
  });
});
