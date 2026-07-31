import { Injectable } from '@nestjs/common';
import { OrderStatusType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const cartInclude = {
  items: {
    include: {
      gear: {
        include: {
          lender: { select: { id: true, full_name: true } },
          media: {
            where: { is_primary: true },
            orderBy: { sort_order: 'asc' as const },
            take: 1,
          },
        },
      },
    },
    orderBy: { created_at: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getOrCreate(renterId: string) {
    return this.prisma.cart.upsert({
      where: { renter_id: renterId },
      create: { renter_id: renterId },
      update: {},
      include: cartInclude,
    });
  }

  findGear(id: string) {
    return this.prisma.gear.findUnique({ where: { id } });
  }

  async hasOverlap(gearId: string, startDate: Date, endDate: Date) {
    return (
      (await this.prisma.rentalOrder.findFirst({
        where: {
          gear_id: gearId,
          status: {
            notIn: [OrderStatusType.cancelled, OrderStatusType.completed],
          },
          start_date: { lt: endDate },
          end_date: { gt: startDate },
        },
        select: { id: true },
      })) !== null
    );
  }

  async upsertItem(
    renterId: string,
    gearId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const cart = await this.prisma.cart.upsert({
      where: { renter_id: renterId },
      create: { renter_id: renterId },
      update: {},
      select: { id: true },
    });
    return this.prisma.cartItem.upsert({
      where: { cart_id_gear_id: { cart_id: cart.id, gear_id: gearId } },
      create: {
        cart_id: cart.id,
        gear_id: gearId,
        start_date: startDate,
        end_date: endDate,
      },
      update: { start_date: startDate, end_date: endDate },
      include: cartInclude.items.include,
    });
  }

  findOwnedItem(renterId: string, itemId: string) {
    return this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { renter_id: renterId } },
      select: { id: true },
    });
  }

  deleteItem(id: string) {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  clear(renterId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cart: { renter_id: renterId } },
    });
  }
}
