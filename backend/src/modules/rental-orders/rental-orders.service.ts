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
import { GetRentalOrdersQueryDto } from './dto/get-rental-orders-query.dto';
import { RentalOrdersRepository } from './rental-orders.repository';

interface CurrentUser {
  id: string;
  role: UserRole;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class RentalOrdersService {
  constructor(
    private readonly rentalOrdersRepository: RentalOrdersRepository,
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
}
