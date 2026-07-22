import { Injectable } from '@nestjs/common';
import { OrderStatusType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface FindRentalOrdersOptions {
  where: Prisma.RentalOrderWhereInput;
  page: number;
  limit: number;
  status?: OrderStatusType;
}

@Injectable()
export class RentalOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGearById(id: string) {
    return this.prisma.gear.findUnique({ where: { id } });
  }

  async hasOverlappingOrder(
    gearId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const order = await this.prisma.rentalOrder.findFirst({
      where: {
        gear_id: gearId,
        status: {
          notIn: [OrderStatusType.cancelled, OrderStatusType.completed],
        },
        start_date: { lt: endDate },
        end_date: { gt: startDate },
      },
      select: { id: true },
    });

    return order !== null;
  }

  findByOrderCode(orderCode: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { order_code: orderCode },
      select: { id: true },
    });
  }

  create(data: Prisma.RentalOrderUncheckedCreateInput) {
    return this.prisma.rentalOrder.create({ data });
  }

  async findAll(options: FindRentalOrdersOptions) {
    const { where, page, limit, status } = options;
    const scopedWhere: Prisma.RentalOrderWhereInput = {
      ...where,
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.rentalOrder.findMany({
        where: scopedWhere,
        include: {
          gear: {
            select: {
              id: true,
              name: true,
              rent_price_per_day: true,
              media: {
                where: { is_primary: true },
                orderBy: { sort_order: 'asc' },
                take: 1,
              },
            },
          },
          renter: { select: { id: true, full_name: true, avatar_url: true } },
          lender: { select: { id: true, full_name: true, avatar_url: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rentalOrder.count({ where: scopedWhere }),
    ]);

    return { data, total };
  }

  findById(id: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        gear: { include: { media: { orderBy: { sort_order: 'asc' } } } },
        renter: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            phone: true,
            rating: true,
          },
        },
        lender: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            phone: true,
            rating: true,
          },
        },
        disputes: true,
      },
    });
  }

  async transition(
    id: string,
    expectedStatus: OrderStatusType,
    data: Prisma.RentalOrderUpdateManyMutationInput,
  ) {
    const result = await this.prisma.rentalOrder.updateMany({
      where: { id, status: expectedStatus },
      data,
    });

    if (result.count !== 1) return null;
    return this.findById(id);
  }
}
