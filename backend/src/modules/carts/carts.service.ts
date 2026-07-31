import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatusType, GearStatusType, UserRole } from '@prisma/client';
import type { JwtPayload } from '../../common/types/authentication';
import { CartsRepository } from './carts.repository';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';

const DAY_MS = 86_400_000;

@Injectable()
export class CartsService {
  constructor(private readonly cartsRepository: CartsRepository) {}

  async get(user: JwtPayload) {
    this.assertRenter(user);
    return this.mapCart(await this.cartsRepository.getOrCreate(user.id));
  }

  async upsert(user: JwtPayload, gearId: string, dto: UpsertCartItemDto) {
    this.assertRenter(user);
    const startDate = this.parseDate(dto.startDate);
    const endDate = this.parseDate(dto.endDate);
    if (startDate >= endDate) this.invalidDates();

    const gear = await this.cartsRepository.findGear(gearId);
    if (!gear) {
      throw new NotFoundException({
        error: 'GEAR_NOT_FOUND',
        message: 'Gear not found',
      });
    }
    if (
      gear.approval_status !== ApprovalStatusType.approved ||
      gear.status !== GearStatusType.available
    ) {
      throw new BadRequestException({
        error: 'GEAR_NOT_AVAILABLE',
        message: 'Gear is not available for rental',
      });
    }
    if (gear.lender_id === user.id) {
      throw new BadRequestException({
        error: 'CANNOT_RENT_OWN_GEAR',
        message: 'You cannot rent your own gear',
      });
    }
    if (await this.cartsRepository.hasOverlap(gearId, startDate, endDate)) {
      throw new ConflictException({
        error: 'GEAR_UNAVAILABLE_FOR_PERIOD',
        message: 'Gear is already booked for the requested period',
      });
    }

    const item = await this.cartsRepository.upsertItem(
      user.id,
      gearId,
      startDate,
      endDate,
    );
    return this.mapItem(item, true);
  }

  async remove(user: JwtPayload, itemId: string) {
    this.assertRenter(user);
    if (!(await this.cartsRepository.findOwnedItem(user.id, itemId))) {
      throw new NotFoundException({
        error: 'CART_ITEM_NOT_FOUND',
        message: 'Cart item not found',
      });
    }
    await this.cartsRepository.deleteItem(itemId);
    return this.get(user);
  }

  async clear(user: JwtPayload) {
    this.assertRenter(user);
    await this.cartsRepository.getOrCreate(user.id);
    await this.cartsRepository.clear(user.id);
    return this.get(user);
  }

  private assertRenter(user: JwtPayload) {
    if (user.role !== UserRole.renter) {
      throw new ForbiddenException({
        error: 'RENTER_ONLY',
        message: 'Only renters can use a cart',
      });
    }
  }

  private parseDate(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      this.invalidDates();
    }
    return date;
  }

  private invalidDates(): never {
    throw new BadRequestException({
      error: 'INVALID_DATE_RANGE',
      message:
        'startDate and endDate must be valid and startDate must be earlier',
    });
  }

  private async mapCart(
    cart: Awaited<ReturnType<CartsRepository['getOrCreate']>>,
  ) {
    const items = await Promise.all(
      cart.items.map(async (item) =>
        this.mapItem(
          item,
          item.gear.approval_status === ApprovalStatusType.approved &&
            item.gear.status === GearStatusType.available &&
            !(await this.cartsRepository.hasOverlap(
              item.gear_id,
              item.start_date,
              item.end_date,
            )),
        ),
      ),
    );
    return { id: cart.id, items, updatedAt: cart.updated_at };
  }

  private mapItem(
    item: Awaited<ReturnType<CartsRepository['upsertItem']>>,
    eligible: boolean,
  ) {
    const durationDays =
      (item.end_date.getTime() - item.start_date.getTime()) / DAY_MS;
    const rentPricePerDay = Number(item.gear.rent_price_per_day);
    const stateEligible =
      item.gear.approval_status === ApprovalStatusType.approved &&
      item.gear.status === GearStatusType.available;
    return {
      id: item.id,
      gearId: item.gear_id,
      startDate: item.start_date.toISOString().slice(0, 10),
      endDate: item.end_date.toISOString().slice(0, 10),
      durationDays,
      rentPricePerDay,
      rentalFee: rentPricePerDay * durationDays,
      depositAmount: Number(
        item.gear.value ?? rentPricePerDay * durationDays * 2,
      ),
      availability: {
        eligible,
        code: eligible
          ? 'available'
          : stateEligible
            ? 'period_conflict'
            : 'gear_unavailable',
      },
      gear: {
        id: item.gear.id,
        name: item.gear.name,
        status: item.gear.status,
        approvalStatus: item.gear.approval_status,
        primaryMediaUrl: item.gear.media[0]?.url ?? null,
        lender: {
          id: item.gear.lender.id,
          fullName: item.gear.lender.full_name,
        },
      },
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}
