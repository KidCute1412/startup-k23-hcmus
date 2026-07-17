import {
  ApprovalStatusType,
  DepositTypeEnum,
  GearStatusType,
  OrderStatusType,
  UserRole,
} from '@prisma/client';
import { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import { RentalOrdersRepository } from './rental-orders.repository';
import { RentalOrdersService } from './rental-orders.service';

describe('RentalOrdersService', () => {
  let service: RentalOrdersService;
  let repository: {
    findGearById: jest.Mock;
    hasOverlappingOrder: jest.Mock;
    findByOrderCode: jest.Mock;
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
  };

  const dto: CreateRentalOrderDto = {
    gearId: '30000000-0000-0000-0000-000000000001',
    startDate: '2026-08-01',
    endDate: '2026-08-06',
    depositType: DepositTypeEnum.traditional,
    shippingAddress: '123 Nguyen Hue, District 1, HCMC',
    shippingName: 'Nguyen Van A',
    shippingPhone: '0987654321',
  };

  const approvedGear = {
    id: dto.gearId,
    lender_id: '00000000-0000-0000-0000-000000000002',
    approval_status: ApprovalStatusType.approved,
    status: GearStatusType.available,
    rent_price_per_day: 80_000,
    value: 4_500_000,
  };

  beforeEach(() => {
    repository = {
      findGearById: jest.fn().mockResolvedValue({ ...approvedGear }),
      hasOverlappingOrder: jest.fn().mockResolvedValue(false),
      findByOrderCode: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data: object) =>
          Promise.resolve({ id: 'order-id', ...data }),
        ),
      findAll: jest.fn(),
      findById: jest.fn(),
    };
    service = new RentalOrdersService(
      repository as unknown as RentalOrdersRepository,
    );
  });

  it('rejects a gear that is not approved with GEAR_NOT_AVAILABLE', async () => {
    repository.findGearById.mockResolvedValue({
      ...approvedGear,
      approval_status: ApprovalStatusType.pending,
    });

    await expect(service.create('renter-id', dto)).rejects.toMatchObject({
      status: 400,
      response: { error: 'GEAR_NOT_AVAILABLE' },
    });
  });

  it('rejects startDate >= endDate with INVALID_DATE_RANGE', async () => {
    await expect(
      service.create('renter-id', { ...dto, startDate: dto.endDate }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_DATE_RANGE' },
    });
    expect(repository.findGearById).not.toHaveBeenCalled();
  });

  it('rejects an overlapping active booking with GEAR_UNAVAILABLE_FOR_PERIOD', async () => {
    repository.hasOverlappingOrder.mockResolvedValue(true);

    await expect(service.create('renter-id', dto)).rejects.toMatchObject({
      status: 409,
      response: { error: 'GEAR_UNAVAILABLE_FOR_PERIOD' },
    });
  });

  it('creates a pending order with lender and price snapshots derived from the gear', async () => {
    const order = await service.create('renter-id', dto);

    expect(order).toMatchObject({
      renter_id: 'renter-id',
      lender_id: approvedGear.lender_id,
      gear_id: approvedGear.id,
      duration_days: 5,
      snapped_rent_price_per_day: 80_000,
      rental_fee: 400_000,
      deposit_amount: 4_500_000,
      status: OrderStatusType.pending_confirm,
    });
    expect(order.order_code).toMatch(/^ORD-\d{8}-\d{6}$/);
  });

  it('keeps the order price snapshot unchanged when the gear price changes later', async () => {
    const gear = { ...approvedGear };
    repository.findGearById.mockResolvedValue(gear);

    const order = await service.create('renter-id', dto);
    gear.rent_price_per_day = 120_000;

    expect(order.snapped_rent_price_per_day).toBe(80_000);
    expect(order.rental_fee).toBe(400_000);
  });

  it('falls back to twice the rental fee when the gear has no value', async () => {
    repository.findGearById.mockResolvedValue({ ...approvedGear, value: null });

    const order = await service.create('renter-id', dto);

    expect(order.deposit_amount).toBe(800_000);
  });

  it('scopes a renter list and applies status and pagination', async () => {
    repository.findAll.mockResolvedValue({
      data: [{ id: 'order-id' }],
      total: 11,
    });

    const result = await service.findAll(
      { id: 'renter-id', role: UserRole.renter },
      { status: OrderStatusType.confirmed, page: 1, limit: 10 },
    );

    expect(repository.findAll).toHaveBeenCalledWith({
      where: { renter_id: 'renter-id' },
      status: OrderStatusType.confirmed,
      page: 1,
      limit: 10,
    });
    expect(result.meta).toEqual({
      total: 11,
      page: 1,
      limit: 10,
      totalPages: 2,
    });
  });

  it('allows an admin to list every order', async () => {
    repository.findAll.mockResolvedValue({ data: [], total: 0 });

    await service.findAll(
      { id: 'admin-id', role: UserRole.admin },
      { page: 1, limit: 10 },
    );

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('forbids detail access for a user unrelated to the order', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
    });

    await expect(
      service.findOne({ id: 'other-id', role: UserRole.renter }, 'order-id'),
    ).rejects.toMatchObject({
      status: 403,
      response: { error: 'FORBIDDEN' },
    });
  });

  it.each([
    { id: 'renter-id', role: UserRole.renter },
    { id: 'lender-id', role: UserRole.lender },
    { id: 'admin-id', role: UserRole.admin },
  ])('allows renter, lender, and admin detail access', async (user) => {
    const order = {
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
    };
    repository.findById.mockResolvedValue(order);

    await expect(service.findOne(user, order.id)).resolves.toBe(order);
  });
});
