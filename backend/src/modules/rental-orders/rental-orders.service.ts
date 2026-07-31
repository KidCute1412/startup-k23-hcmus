import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatusType,
  GearStatusType,
  OrderStatusType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { randomInt } from 'crypto';
import { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import { CreateBatchRentalOrdersDto } from './dto/create-batch-rental-orders.dto';
import { GetRentalOrdersQueryDto } from './dto/get-rental-orders-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { RentalOrdersRepository } from './rental-orders.repository';

interface CurrentUser {
  id: string;
  role: UserRole;
}

type TransitionActor = 'renter' | 'lender';

interface TransitionOptions {
  actor: TransitionActor;
  currentStatus: OrderStatusType;
  nextStatus: OrderStatusType;
  action: string;
  timestampField?:
    | 'lender_shipped_at'
    | 'renter_received_at'
    | 'renter_returned_at'
    | 'lender_received_back_at';
  beforeUpdate?: () => Promise<unknown>;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class RentalOrdersService {
  private readonly PLATFORM_FEE_RATE = 0.15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rentalOrdersRepository: RentalOrdersRepository,
    private readonly escrowService: EscrowService,
  ) {}

  async create(renterId: string, dto: CreateRentalOrderDto) {
    const startDate = this.parseDateOnly(dto.startDate);
    const endDate = this.parseDateOnly(dto.endDate);

    if (startDate.getTime() >= endDate.getTime()) {
      throw new BadRequestException({
        error: 'INVALID_DATE_RANGE',
        message: 'startDate must be earlier than endDate',
      });
    }

    const gear = await this.rentalOrdersRepository.findGearById(dto.gearId);
    if (
      !gear ||
      gear.approval_status !== ApprovalStatusType.approved ||
      gear.status !== GearStatusType.available
    ) {
      throw new BadRequestException({
        error: 'GEAR_NOT_AVAILABLE',
        message: 'Gear is not available for rental',
      });
    }

    if (gear.lender_id === renterId) {
      throw new BadRequestException({
        error: 'CANNOT_RENT_OWN_GEAR',
        message: 'You cannot rent your own gear',
      });
    }

    const hasOverlap = await this.rentalOrdersRepository.hasOverlappingOrder(
      gear.id,
      startDate,
      endDate,
    );
    if (hasOverlap) {
      throw new ConflictException({
        error: 'GEAR_UNAVAILABLE_FOR_PERIOD',
        message: 'Gear is already booked for the requested period',
      });
    }

    const durationDays =
      (endDate.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY;
    const snappedRentPricePerDay = Number(gear.rent_price_per_day);
    const rentalFee = snappedRentPricePerDay * durationDays;
    const depositAmount = Number(gear.value ?? rentalFee * 2);
    const orderCode = await this.generateUniqueOrderCode();

    const data: Prisma.RentalOrderUncheckedCreateInput = {
      order_code: orderCode,
      renter_id: renterId,
      gear_id: gear.id,
      lender_id: gear.lender_id,
      start_date: startDate,
      end_date: endDate,
      duration_days: durationDays,
      snapped_rent_price_per_day: snappedRentPricePerDay,
      rental_fee: rentalFee,
      base_rental_fee: rentalFee,
      deposit_amount: depositAmount,
      deposit_type: dto.depositType,
      status: OrderStatusType.pending_confirm,
      shipping_address: dto.shippingAddress,
      shipping_name: dto.shippingName,
      shipping_phone: dto.shippingPhone,
    };

    return this.rentalOrdersRepository.create(data);
  }

  async createLocked(renterId: string, dto: CreateRentalOrderDto) {
    const startDate = this.parseDateOnly(dto.startDate);
    const endDate = this.parseDateOnly(dto.endDate);
    if (startDate >= endDate) {
      throw new BadRequestException({
        error: 'INVALID_DATE_RANGE',
        message: 'startDate must be earlier than endDate',
      });
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM gears WHERE id = ${dto.gearId}::uuid FOR UPDATE`;
      const gear = await tx.gear.findUnique({ where: { id: dto.gearId } });
      if (
        !gear ||
        gear.approval_status !== ApprovalStatusType.approved ||
        gear.status !== GearStatusType.available
      ) {
        throw new BadRequestException({
          error: 'GEAR_NOT_AVAILABLE',
          message: 'Gear is not available for rental',
        });
      }
      if (gear.lender_id === renterId) {
        throw new BadRequestException({
          error: 'CANNOT_RENT_OWN_GEAR',
          message: 'You cannot rent your own gear',
        });
      }
      const overlap = await tx.rentalOrder.findFirst({
        where: {
          gear_id: gear.id,
          status: {
            notIn: [OrderStatusType.cancelled, OrderStatusType.completed],
          },
          start_date: { lt: endDate },
          end_date: { gt: startDate },
        },
        select: { id: true },
      });
      if (overlap) {
        throw new ConflictException({
          error: 'GEAR_UNAVAILABLE_FOR_PERIOD',
          message: 'Gear is already booked for the requested period',
        });
      }
      const durationDays =
        (endDate.getTime() - startDate.getTime()) / MILLISECONDS_PER_DAY;
      const dailyPrice = Number(gear.rent_price_per_day);
      const rentalFee = dailyPrice * durationDays;
      return tx.rentalOrder.create({
        data: {
          order_code: this.newOrderCode(),
          renter_id: renterId,
          gear_id: gear.id,
          lender_id: gear.lender_id,
          start_date: startDate,
          end_date: endDate,
          duration_days: durationDays,
          snapped_rent_price_per_day: dailyPrice,
          rental_fee: rentalFee,
          base_rental_fee: rentalFee,
          deposit_amount: Number(gear.value ?? rentalFee * 2),
          deposit_type: dto.depositType,
          status: OrderStatusType.pending_confirm,
          shipping_address: dto.shippingAddress,
          shipping_name: dto.shippingName,
          shipping_phone: dto.shippingPhone,
        },
      });
    });
  }

  async createBatch(renterId: string, dto: CreateBatchRentalOrdersDto) {
    const itemIds = [...dto.cartItemIds].sort();
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT ci.id
          FROM cart_items ci
          JOIN carts c ON c.id = ci.cart_id
          WHERE ci.id IN (${Prisma.join(itemIds.map((id) => Prisma.sql`${id}::uuid`))})
          ORDER BY ci.id FOR UPDATE`,
      );
      const items = await tx.cartItem.findMany({
        where: { id: { in: itemIds }, cart: { renter_id: renterId } },
        include: { gear: true },
        orderBy: { id: 'asc' },
      });
      if (items.length !== itemIds.length) {
        throw new NotFoundException({
          error: 'CART_ITEM_NOT_FOUND',
          message: 'One or more cart items were not found',
        });
      }

      const gearIds = items.map((item) => item.gear_id).sort();
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM gears
          WHERE id IN (${Prisma.join(gearIds.map((id) => Prisma.sql`${id}::uuid`))})
          ORDER BY id FOR UPDATE`,
      );

      const orders: object[] = [];
      for (const item of items) {
        const gear = item.gear;
        if (
          gear.approval_status !== ApprovalStatusType.approved ||
          gear.status !== GearStatusType.available
        ) {
          throw new BadRequestException({
            error: 'GEAR_NOT_AVAILABLE',
            message: 'Gear is not available for rental',
          });
        }
        if (gear.lender_id === renterId) {
          throw new BadRequestException({
            error: 'CANNOT_RENT_OWN_GEAR',
            message: 'You cannot rent your own gear',
          });
        }
        const overlap = await tx.rentalOrder.findFirst({
          where: {
            gear_id: gear.id,
            status: {
              notIn: [OrderStatusType.cancelled, OrderStatusType.completed],
            },
            start_date: { lt: item.end_date },
            end_date: { gt: item.start_date },
          },
          select: { id: true },
        });
        if (overlap) {
          throw new ConflictException({
            error: 'GEAR_UNAVAILABLE_FOR_PERIOD',
            message: 'Gear is already booked for the requested period',
          });
        }
        const durationDays =
          (item.end_date.getTime() - item.start_date.getTime()) /
          MILLISECONDS_PER_DAY;
        if (durationDays <= 0) {
          throw new BadRequestException({
            error: 'INVALID_DATE_RANGE',
            message: 'Cart item has an invalid rental period',
          });
        }
        const dailyPrice = Number(gear.rent_price_per_day);
        const rentalFee = dailyPrice * durationDays;
        orders.push(
          await tx.rentalOrder.create({
            data: {
              order_code: this.newOrderCode(),
              renter_id: renterId,
              gear_id: gear.id,
              lender_id: gear.lender_id,
              start_date: item.start_date,
              end_date: item.end_date,
              duration_days: durationDays,
              snapped_rent_price_per_day: dailyPrice,
              rental_fee: rentalFee,
              base_rental_fee: rentalFee,
              deposit_amount: Number(gear.value ?? rentalFee * 2),
              deposit_type: dto.depositType,
              status: OrderStatusType.pending_confirm,
              shipping_address: dto.shippingAddress,
              shipping_name: dto.shippingName,
              shipping_phone: dto.shippingPhone,
            },
          }),
        );
      }
      await tx.cartItem.deleteMany({ where: { id: { in: itemIds } } });
      return { orders, removedCartItemIds: itemIds };
    });
  }

  async findAll(user: CurrentUser, query: GetRentalOrdersQueryDto) {
    const where = this.buildAccessScope(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.rentalOrdersRepository.findAll({
      where,
      status: query.status,
      page,
      limit,
    });

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async findOne(user: CurrentUser, id: string) {
    const order = await this.rentalOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Rental order not found',
      });
    }

    const canView =
      user.role === UserRole.admin ||
      order.renter_id === user.id ||
      order.lender_id === user.id;
    if (!canView) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'You do not have permission to view this rental order',
      });
    }

    return order;
  }

  async confirm(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${id}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Rental order not found',
        });
      }
      if (order.lender_id !== userId) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'Only the order lender can perform this transition',
        });
      }
      if (order.status !== OrderStatusType.pending_confirm) {
        throw new BadRequestException({
          error: 'INVALID_TRANSITION',
          message: `Cannot confirm rental order from status ${order.status}`,
        });
      }

      await this.escrowService.lock(id, tx);

      const platformFee = order.rental_fee.mul(this.PLATFORM_FEE_RATE);
      const lenderIncome = order.rental_fee.sub(platformFee);

      return tx.rentalOrder.update({
        where: { id },
        data: {
          status: OrderStatusType.confirmed,
          platform_fee: platformFee,
          lender_income: lenderIncome,
        },
      });
    });
  }

  ship(userId: string, id: string) {
    return this.performTransition(userId, id, {
      actor: 'lender',
      currentStatus: OrderStatusType.confirmed,
      nextStatus: OrderStatusType.delivering,
      action: 'ship',
      timestampField: 'lender_shipped_at',
    });
  }

  cancel(userId: string, id: string) {
    return this.performTransition(userId, id, {
      actor: 'renter',
      currentStatus: OrderStatusType.pending_confirm,
      nextStatus: OrderStatusType.cancelled,
      action: 'cancel',
    });
  }

  confirmReceipt(userId: string, id: string) {
    return this.performTransition(userId, id, {
      actor: 'renter',
      currentStatus: OrderStatusType.delivering,
      nextStatus: OrderStatusType.active,
      action: 'confirm receipt of',
      timestampField: 'renter_received_at',
    });
  }

  returnOrder(userId: string, id: string) {
    return this.performTransition(userId, id, {
      actor: 'renter',
      currentStatus: OrderStatusType.active,
      nextStatus: OrderStatusType.returning,
      action: 'return',
      timestampField: 'renter_returned_at',
    });
  }

  async confirmReturn(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${id}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Rental order not found',
        });
      }
      if (order.lender_id !== userId) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'Only the order lender can perform this transition',
        });
      }
      if (order.status !== OrderStatusType.returning) {
        throw new BadRequestException({
          error: 'INVALID_TRANSITION',
          message: `Cannot confirm return of rental order from status ${order.status}`,
        });
      }

      await this.escrowService.release(id, tx);

      return tx.rentalOrder.update({
        where: { id },
        data: {
          status: OrderStatusType.completed,
          lender_received_back_at: new Date(),
        },
      });
    });
  }

  private async performTransition(
    userId: string,
    id: string,
    options: TransitionOptions,
  ) {
    const order = await this.rentalOrdersRepository.findById(id);
    if (!order) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Rental order not found',
      });
    }

    const actorId =
      options.actor === 'lender' ? order.lender_id : order.renter_id;
    if (actorId !== userId) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: `Only the order ${options.actor} can perform this transition`,
      });
    }

    if (order.status !== options.currentStatus) {
      throw this.invalidTransition(options.action, order.status);
    }

    await options.beforeUpdate?.();

    const data: Prisma.RentalOrderUpdateManyMutationInput = {
      status: options.nextStatus,
      ...(options.timestampField
        ? { [options.timestampField]: new Date() }
        : {}),
    };
    const transitionedOrder = await this.rentalOrdersRepository.transition(
      id,
      options.currentStatus,
      data,
    );

    if (!transitionedOrder) {
      throw this.invalidTransition(options.action, order.status);
    }
    return transitionedOrder;
  }

  private invalidTransition(action: string, status: OrderStatusType) {
    return new BadRequestException({
      error: 'INVALID_TRANSITION',
      message: `Cannot ${action} rental order from status ${status}`,
    });
  }

  private buildAccessScope(user: CurrentUser): Prisma.RentalOrderWhereInput {
    if (user.role === UserRole.admin) return {};

    if (user.role === UserRole.lender) return { lender_id: user.id };
    return { renter_id: user.id };
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException({
        error: 'INVALID_DATE_RANGE',
        message: 'startDate and endDate must be valid ISO date strings',
      });
    }
    return date;
  }

  private async generateUniqueOrderCode(): Promise<string> {
    const now = new Date();
    const datePart = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      String(now.getUTCDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const orderCode = `ORD-${datePart}-${suffix}`;
      const existingOrder =
        await this.rentalOrdersRepository.findByOrderCode(orderCode);
      if (!existingOrder) return orderCode;
    }

    throw new InternalServerErrorException({
      error: 'ORDER_CODE_GENERATION_FAILED',
      message: 'Could not generate a unique rental order code',
    });
  }

  private newOrderCode() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
    return `ORD-${datePart}-${String(randomInt(0, 1_000_000)).padStart(6, '0')}`;
  }
}
