import { Injectable } from '@nestjs/common';
import { OrderStatusType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface FindRentalOrdersOptions {
  where: Prisma.RentalOrderWhereInput;
  page: number;
  limit: number;
  status?: OrderStatusType;
}

export const BLOCKING_ORDER_STATUSES: readonly OrderStatusType[] = [
  OrderStatusType.pending_confirm,
  OrderStatusType.confirmed,
  OrderStatusType.delivering,
  OrderStatusType.active,
  OrderStatusType.returning,
  OrderStatusType.disputed,
] as const;

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
          in: [...BLOCKING_ORDER_STATUSES],
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

  findProofOrderById(id: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { id },
      select: {
        id: true,
        renter_id: true,
        lender_id: true,
        status: true,
      },
    });
  }

  createProof(data: Prisma.RentalProofUncheckedCreateInput) {
    return this.prisma.rentalProof.create({ data });
  }

  findProofs(rentalOrderId: string) {
    return this.prisma.rentalProof.findMany({
      where: { rental_order_id: rentalOrderId },
      orderBy: [{ uploaded_at: 'asc' }, { id: 'asc' }],
    });
  }
}
