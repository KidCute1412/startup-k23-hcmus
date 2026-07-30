import {
  ApprovalStatusType,
  DepositTypeEnum,
  GearStatusType,
  OrderStatusType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import { EscrowService } from '../escrow/escrow.service';
import {
  BLOCKING_ORDER_STATUSES,
  RentalOrdersRepository,
} from './rental-orders.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { RentalOrdersService } from './rental-orders.service';
import { RentalOrderOrchestrationService } from './rental-order-orchestration.service';

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
  let uploadedProofs: Set<string>;
  let escrowService: {
    lock: jest.Mock;
    release: jest.Mock;
    compensate: jest.Mock;
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

  let txOrderState: Record<string, unknown>;

  function cloneTxOrder(src: Record<string, unknown>): Record<string, unknown> {
    const cloned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(src)) {
      cloned[key] =
        val instanceof Prisma.Decimal ? new Prisma.Decimal(val) : val;
    }
    return cloned;
  }

  function createTxMock() {
    const state: Record<string, unknown> = cloneTxOrder(txOrderState);
    return {
      $queryRaw: jest.fn().mockResolvedValue([]),
      rentalOrder: {
        findUnique: jest.fn(() => Promise.resolve(state ? { ...state } : null)),
        update: jest.fn(
          (_args: { where: { id: string }; data: Record<string, unknown> }) => {
            if (state) {
              Object.assign(state, _args.data);
              Object.assign(txOrderState, _args.data);
            }
            return Promise.resolve(state ? { ...state } : null);
          },
        ),
      },
      rentalProof: {
        findFirst: jest.fn(
          ({ where }: { where: { stage: string; uploaded_by: string } }) =>
            Promise.resolve(
              uploadedProofs.has(`${where.stage}:${where.uploaded_by}`)
                ? { id: 'proof-id' }
                : null,
            ),
        ),
      },
    };
  }

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-29T00:00:00.000Z'));
  });

  beforeEach(() => {
    uploadedProofs = new Set();
    txOrderState = {
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.pending_confirm,
      rental_fee: new Prisma.Decimal(400000),
      deposit_amount: new Prisma.Decimal(4500000),
      deposit_type: 'traditional',
      platform_fee: new Prisma.Decimal(0),
      lender_income: new Prisma.Decimal(0),
    };
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
    escrowService = {
      lock: jest.fn().mockResolvedValue({ escrowId: 'escrow-id' }),
      release: jest.fn().mockResolvedValue({ escrowId: 'escrow-id' }),
      compensate: jest.fn().mockResolvedValue({ escrowId: 'escrow-id' }),
    };
    const prisma = {
      $transaction: jest.fn((cb: (tx: object) => unknown) =>
        cb(createTxMock()),
      ),
    } as unknown as PrismaService;
    const orchestration = new RentalOrderOrchestrationService(
      prisma,
      escrowService as unknown as EscrowService,
    );
    service = new RentalOrdersService(
      repository as unknown as RentalOrdersRepository,
      orchestration,
    );
  });

  afterAll(() => {
    jest.useRealTimers();
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

  it('rejects a past startDate using the fixed Ho Chi Minh business date', async () => {
    await expect(
      service.create('renter-id', {
        ...dto,
        startDate: '2026-07-28',
        endDate: '2026-07-30',
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'START_DATE_IN_PAST' },
    });
    expect(repository.findGearById).not.toHaveBeenCalled();
  });

  it('allows startDate on the current Ho Chi Minh business date', async () => {
    await expect(
      service.create('renter-id', {
        ...dto,
        startDate: '2026-07-29',
        endDate: '2026-07-30',
      }),
    ).resolves.toMatchObject({
      status: OrderStatusType.pending_confirm,
    });
  });

  it('blocks overlap only for non-terminal order statuses', () => {
    expect(BLOCKING_ORDER_STATUSES).toEqual([
      OrderStatusType.pending_confirm,
      OrderStatusType.confirmed,
      OrderStatusType.delivering,
      OrderStatusType.active,
      OrderStatusType.returning,
      OrderStatusType.disputed,
    ]);
    expect(BLOCKING_ORDER_STATUSES).not.toContain(OrderStatusType.cancelled);
    expect(BLOCKING_ORDER_STATUSES).not.toContain(OrderStatusType.completed);
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

  it('forbids a renter from confirming an order without calling escrow', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.pending_confirm,
    });

    await expect(
      service.confirm('renter-id', 'order-id'),
    ).rejects.toMatchObject({
      status: 403,
      response: { error: 'FORBIDDEN' },
    });
    expect(escrowService.lock).not.toHaveBeenCalled();
  });

  it('forbids a lender from returning an active order', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.active,
    });

    await expect(
      service.returnOrder('lender-id', 'order-id'),
    ).rejects.toMatchObject({
      status: 403,
      response: { error: 'FORBIDDEN' },
    });
  });

  it('rejects confirm outside pending_confirm without calling escrow', async () => {
    txOrderState.status = OrderStatusType.delivering;

    await expect(
      service.confirm('lender-id', 'order-id'),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_TRANSITION' },
    });
    expect(escrowService.lock).not.toHaveBeenCalled();
  });

  it('keeps pending_confirm when escrow lock fails', async () => {
    escrowService.lock.mockRejectedValue({
      status: 400,
      response: { error: 'INSUFFICIENT_CASH' },
    });

    await expect(
      service.confirm('lender-id', 'order-id'),
    ).rejects.toMatchObject({
      response: { error: 'INSUFFICIENT_CASH' },
    });
    expect(txOrderState.status).toBe(OrderStatusType.pending_confirm);
  });

  it('confirms once and treats a repeated confirm as an idempotent success', async () => {
    await expect(
      service.confirm('lender-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.confirmed,
    });
    await expect(
      service.confirm('lender-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.confirmed,
    });
    expect(escrowService.lock).toHaveBeenCalledTimes(1);
  });

  it('runs the complete happy-path lifecycle with the correct actors and timestamps', async () => {
    await expect(
      service.confirm('lender-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.confirmed,
    });
    expect(txOrderState.status).toBe(OrderStatusType.confirmed);

    uploadedProofs.add('pre_shipment:lender-id');
    await expect(service.ship('lender-id', 'order-id')).resolves.toMatchObject({
      status: OrderStatusType.delivering,
    });

    await expect(
      service.confirmReceipt('renter-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.active,
    });

    await expect(
      service.returnOrder('renter-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.returning,
    });

    uploadedProofs.add('pre_return:renter-id');
    uploadedProofs.add('post_returned:lender-id');
    await expect(
      service.confirmReturn('lender-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.completed,
    });
    expect(txOrderState.lender_shipped_at).toBeInstanceOf(Date);
    expect(txOrderState.renter_received_at).toBeInstanceOf(Date);
    expect(txOrderState.renter_returned_at).toBeInstanceOf(Date);
    expect(txOrderState.lender_received_back_at).toBeInstanceOf(Date);
  });

  it('lets only the renter cancel a pending order', async () => {
    await expect(
      service.cancel('renter-id', 'order-id'),
    ).resolves.toMatchObject({
      status: OrderStatusType.cancelled,
    });
  });
});
