import { Injectable } from '@nestjs/common';
import { Gear, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GearCatalogSort } from './dto/get-gears-query.dto';

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

interface FindMineOptions {
  lenderId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

const categorySelect = {
  id: true,
  parent_id: true,
  name: true,
  slug: true,
  description: true,
} satisfies Prisma.GearCategorySelect;

const mediaSelect = {
  id: true,
  type: true,
  url: true,
  is_primary: true,
  sort_order: true,
} satisfies Prisma.GearMediaSelect;

const lenderSelect = {
  id: true,
  full_name: true,
  avatar_url: true,
  rating: true,
  total_reviews: true,
} satisfies Prisma.UserSelect;

const publicGearSelect = {
  id: true,
  lender_id: true,
  category_id: true,
  name: true,
  brand: true,
  model: true,
  description: true,
  specifications: true,
  value: true,
  rent_price_per_day: true,
  status: true,
  approval_status: true,
  created_at: true,
  updated_at: true,
  category: { select: categorySelect },
  media: {
    select: mediaSelect,
    orderBy: [{ is_primary: 'desc' as const }, { sort_order: 'asc' as const }],
  },
  lender: { select: lenderSelect },
} satisfies Prisma.GearSelect;

export type PublicGearRecord = Prisma.GearGetPayload<{
  select: typeof publicGearSelect;
}> & { rating: number; reviewCount: number };

const detailGearSelect = {
  ...publicGearSelect,
  serial_number: true,
  reviews: {
    where: { target_type: 'gear' as const },
    orderBy: [{ created_at: 'desc' as const }, { id: 'desc' as const }],
    select: {
      id: true,
      rating: true,
      comment: true,
      created_at: true,
      reviewer: {
        select: { id: true, full_name: true, avatar_url: true },
      },
    },
  },
} satisfies Prisma.GearSelect;

export type PublicGearDetailRecord = Prisma.GearGetPayload<{
  select: typeof detailGearSelect;
}> & { rating: number; reviewCount: number };

type RankedGearRow = {
  id: string;
  rating: number | null;
  review_count: bigint;
};

@Injectable()
export class GearsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GearUncheckedCreateInput): Promise<Gear> {
    return this.prisma.gear.create({ data });
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: PublicGearRecord[]; total: number }> {
    const { page, limit, category, categoryId, minPrice, maxPrice, search } =
      options;
    const predicates: Prisma.Sql[] = [
      Prisma.sql`g.approval_status = 'approved'`,
      Prisma.sql`g.status = 'available'`,
    ];

    const targetCategorySelector = category || categoryId;
    const isUuid =
      targetCategorySelector &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        targetCategorySelector,
      );

    if (targetCategorySelector) {
      predicates.push(
        Prisma.sql`g.category_id IN (SELECT id FROM category_tree)`,
      );
    }
    if (minPrice !== undefined) {
      predicates.push(Prisma.sql`g.rent_price_per_day >= ${minPrice}`);
    }
    if (maxPrice !== undefined) {
      predicates.push(Prisma.sql`g.rent_price_per_day <= ${maxPrice}`);
    }
    if (search) {
      const like = `%${search}%`;
      const substring = Prisma.sql`(
        g.name ILIKE ${like} OR
        COALESCE(g.brand, '') ILIKE ${like} OR
        COALESCE(g.model, '') ILIKE ${like} OR
        COALESCE(g.description, '') ILIKE ${like}
      )`;
      predicates.push(
        search.length < 3
          ? substring
          : Prisma.sql`(
              ${substring} OR
              g.name % ${search} OR
              COALESCE(g.brand, '') % ${search} OR
              COALESCE(g.model, '') % ${search}
            )`,
      );
    }

    const categoryCte = targetCategorySelector
      ? isUuid
        ? Prisma.sql`WITH RECURSIVE category_tree AS (
            SELECT id FROM gear_categories WHERE id = ${targetCategorySelector}::uuid
            UNION ALL
            SELECT child.id
            FROM gear_categories child
            JOIN category_tree parent ON child.parent_id = parent.id
          )`
        : Prisma.sql`WITH RECURSIVE category_tree AS (
            SELECT id FROM gear_categories WHERE slug = ${targetCategorySelector}
            UNION ALL
            SELECT child.id
            FROM gear_categories child
            JOIN category_tree parent ON child.parent_id = parent.id
          )`
      : Prisma.empty;
    const where = Prisma.sql`WHERE ${Prisma.join(predicates, ' AND ')}`;
    const relevance = search
      ? Prisma.sql`GREATEST(
          similarity(g.name, ${search}),
          similarity(COALESCE(g.brand, ''), ${search}),
          similarity(COALESCE(g.model, ''), ${search})
        )`
      : Prisma.sql`0`;
    const orderBy: Record<GearCatalogSort, Prisma.Sql> = {
      relevance: Prisma.sql`relevance DESC`,
      newest: Prisma.sql`g.created_at DESC`,
      priceAsc: Prisma.sql`g.rent_price_per_day ASC`,
      priceDesc: Prisma.sql`g.rent_price_per_day DESC`,
      ratingDesc: Prisma.sql`rating DESC NULLS LAST`,
    };

    const rows = await this.prisma.$queryRaw<RankedGearRow[]>(Prisma.sql`
      ${categoryCte}
      SELECT
        g.id,
        ${relevance} AS relevance,
        COALESCE(AVG(r.rating), 0)::float8 AS rating,
        COUNT(r.id)::bigint AS review_count
      FROM gears g
      LEFT JOIN reviews r
        ON r.target_gear_id = g.id AND r.target_type = 'gear'
      ${where}
      GROUP BY g.id
      ORDER BY ${orderBy[options.sort]}, g.created_at DESC, g.id DESC
      OFFSET ${(page - 1) * limit}
      LIMIT ${limit}
    `);

    const countRows = await this.prisma.$queryRaw<{ total: bigint }[]>(
      Prisma.sql`
        ${categoryCte}
        SELECT COUNT(*)::bigint AS total
        FROM gears g
        ${where}
      `,
    );
    if (!rows.length) {
      return { data: [], total: Number(countRows[0]?.total ?? 0) };
    }

    const records = await this.prisma.gear.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
      select: publicGearSelect,
    });
    const byId = new Map(records.map((record) => [record.id, record]));
    const data = rows.flatMap((row) => {
      const record = byId.get(row.id);
      return record
        ? [
            {
              ...record,
              rating: Number(row.rating ?? 0),
              reviewCount: Number(row.review_count),
            },
          ]
        : [];
    });
    return { data, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: string): Promise<PublicGearDetailRecord | null> {
    const gear = await this.prisma.gear.findFirst({
      where: { id, approval_status: 'approved', status: 'available' },
      select: detailGearSelect,
    });
    if (!gear) return null;
    const aggregate = await this.prisma.review.aggregate({
      where: { target_gear_id: id, target_type: 'gear' },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      ...gear,
      rating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.id,
    };
  }

  async findMine(
    options: FindMineOptions,
  ): Promise<{ data: PublicGearRecord[]; total: number }> {
    const { lenderId, page, limit, search, status } = options;
    const where: Prisma.GearWhereInput = { lender_id: lenderId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        where.approval_status = 'approved';
        where.status = 'available';
      } else if (status === 'paused') {
        where.status = 'maintenance';
      } else if (status === 'pending_approval') {
        where.approval_status = 'pending';
      } else if (status === 'rejected') {
        where.approval_status = 'rejected';
      } else if (status === 'draft') {
        where.status = 'delisted';
      }
    }

    const [gears, total] = await Promise.all([
      this.prisma.gear.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...publicGearSelect,
          reviews: {
            where: { target_type: 'gear' as const },
            select: {
              rating: true,
            },
          },
        },
      }),
      this.prisma.gear.count({ where }),
    ]);

    const data = gears.map((g) => {
      const rating =
        g.reviews.length > 0
          ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
          : 0;
      const reviewCount = g.reviews.length;
      const rest = { ...g } as Record<string, unknown>;
      delete rest.reviews;
      return {
        ...rest,
        rating,
        reviewCount,
      } as unknown as PublicGearRecord;
    });

    return { data, total };
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

  async updateWithMedia(
    id: string,
    data: Prisma.GearUncheckedUpdateInput,
    imageUrls?: string[],
  ): Promise<Gear> {
    return this.prisma.$transaction(async (tx) => {
      if (imageUrls !== undefined) {
        await tx.gearMedia.deleteMany({ where: { gear_id: id } });
        if (imageUrls.length > 0) {
          await tx.gearMedia.createMany({
            data: imageUrls.map((url, index) => ({
              gear_id: id,
              type: 'image',
              url,
              is_primary: index === 0,
              sort_order: index,
            })),
          });
        }
      }
      return tx.gear.update({ where: { id }, data });
    });
  }

  async delete(id: string): Promise<Gear> {
    return this.prisma.gear.delete({ where: { id } });
  }
}
