import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ApprovalStatusType,
  GearStatusType,
  OrderStatusType,
  Prisma,
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { RentalOrdersController } from '../src/modules/rental-orders/rental-orders.controller';
import { RentalOrdersRepository } from '../src/modules/rental-orders/rental-orders.repository';
import { RentalOrdersService } from '../src/modules/rental-orders/rental-orders.service';
import { RentalOrderOrchestrationService } from '../src/modules/rental-orders/rental-order-orchestration.service';
import { MediaService } from '../src/modules/media/media.service';

describe('RentalOrdersController (HTTP)', () => {
  let app: INestApplication<App>;
  let currentUser: { id: string; role: UserRole };
  let repository: {
    findGearById: jest.Mock;
    hasOverlappingOrder: jest.Mock;
    findByOrderCode: jest.Mock;
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    transition: jest.Mock;
  };
  let escrowService: { lock: jest.Mock; release: jest.Mock };
  let prismaService: { $transaction: jest.Mock };
  let addressLookup: jest.Mock;

  beforeEach(async () => {
    currentUser = { id: 'renter-id', role: UserRole.renter };
    repository = {
      findGearById: jest.fn().mockResolvedValue({
        id: '30000000-0000-0000-0000-000000000001',
        lender_id: 'lender-id',
        approval_status: ApprovalStatusType.approved,
        status: GearStatusType.available,
        rent_price_per_day: 80_000,
        value: 4_500_000,
      }),
      hasOverlappingOrder: jest.fn().mockResolvedValue(false),
      findByOrderCode: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((data: object) =>
          Promise.resolve({ id: 'order-id', ...data }),
        ),
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      transition: jest.fn(),
    };
    escrowService = {
      lock: jest.fn().mockResolvedValue({ escrowId: 'escrow-id' }),
      release: jest.fn().mockResolvedValue({ escrowId: 'escrow-id' }),
    };
    const txOrder: Record<string, unknown> & { status: OrderStatusType } = {
      id: 'order-id',
      lender_id: 'lender-id',
      renter_id: 'renter-id',
      status: OrderStatusType.pending_confirm,
      rental_fee: new Prisma.Decimal(100000),
      deposit_amount: new Prisma.Decimal(500000),
      deposit_type: 'traditional',
    };
    const mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      gear: {
        findUnique: jest.fn().mockResolvedValue({
          id: '30000000-0000-0000-0000-000000000001',
          lender_id: 'lender-id',
          approval_status: ApprovalStatusType.approved,
          status: GearStatusType.available,
          rent_price_per_day: 80_000,
          value: 4_500_000,
        }),
      },
      cartItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '40000000-0000-0000-0000-000000000001',
            gear_id: '30000000-0000-0000-0000-000000000001',
            start_date: new Date('2099-08-01T00:00:00.000Z'),
            end_date: new Date('2099-08-06T00:00:00.000Z'),
            gear: {
              id: '30000000-0000-0000-0000-000000000001',
              lender_id: 'lender-id',
              approval_status: ApprovalStatusType.approved,
              status: GearStatusType.available,
              rent_price_per_day: new Prisma.Decimal(80_000),
              value: new Prisma.Decimal(4_500_000),
            },
          },
        ]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      rentalOrder: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'order-id', ...data }),
          ),
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...txOrder })),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(txOrder, data);
          return Promise.resolve({ ...txOrder });
        }),
      },
      userAddress: {
        findFirst: (addressLookup = jest.fn().mockResolvedValue({
          receiver_name: 'Nguyen Van A',
          phone: '0987654321',
          detail_address: '123 Nguyen Hue',
          ward: 'Ben Nghe',
          district: 'District 1',
          province: 'HCMC',
        })),
      },
      rentalProof: {
        findFirst: jest
          .fn()
          .mockImplementation(
            ({ where }: { where: { uploaded_by?: string } }) =>
              Promise.resolve(where.uploaded_by ? { id: 'proof-id' } : null),
          ),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      renterWallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cash-wallet-id' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'cash-wallet-id',
          balance: new Prisma.Decimal(10_000_000),
          locked_balance: new Prisma.Decimal(0),
          status: 'active',
        }),
      },
      renterWalletTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      mutuxWallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'credit-wallet-id' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'credit-wallet-id',
          display_balance: new Prisma.Decimal(10_000_000),
          status: 'active',
        }),
      },
    };
    prismaService = {
      $transaction: jest
        .fn()
        .mockImplementation((fn: (tx: unknown) => unknown) => fn(mockTx)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RentalOrdersController],
      providers: [
        RentalOrdersService,
        RentalOrderOrchestrationService,
        { provide: PrismaService, useValue: prismaService },
        { provide: RentalOrdersRepository, useValue: repository },
        { provide: EscrowService, useValue: escrowService },
        {
          provide: MediaService,
          useValue: {
            assertOwnedImageFile: jest.fn((_userId: string, url: string) =>
              Promise.resolve(url),
            ),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const testRequest = context
            .switchToHttp()
            .getRequest<{ user: typeof currentUser }>();
          testRequest.user = currentUser;
          return true;
        },
      })
      .compile();
    const orchestration = moduleFixture.get(RentalOrderOrchestrationService);
    jest
      .spyOn(
        orchestration as unknown as {
          assertRequiredProofs: (...args: unknown[]) => Promise<void>;
        },
        'assertRequiredProofs',
      )
      .mockResolvedValue(undefined);

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  it('POST /api/v1/rental-orders creates an order using the global response shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/rental-orders')
      .send({
        gearId: '30000000-0000-0000-0000-000000000001',
        startDate: '2099-08-01',
        endDate: '2099-08-06',
        depositType: 'credit_line',
        addressId: '40000000-0000-0000-0000-000000000001',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: 'order-id',
        renter_id: 'renter-id',
        lender_id: 'lender-id',
        status: OrderStatusType.pending_confirm,
        snapped_rent_price_per_day: 80_000,
      },
    });
  });

  it('POST /api/v1/rental-orders rejects an address not owned by the renter', async () => {
    addressLookup.mockResolvedValueOnce(null);

    await request(app.getHttpServer())
      .post('/api/v1/rental-orders')
      .send({
        gearId: '30000000-0000-0000-0000-000000000001',
        startDate: '2099-08-01',
        endDate: '2099-08-06',
        depositType: 'credit_line',
        addressId: '40000000-0000-0000-0000-000000000099',
      })
      .expect(404)
      .expect((response) => {
        const body = response.body as { error: { code: string } };
        expect(body.error.code).toBe('ADDRESS_NOT_FOUND');
      });
  });

  it('POST /api/v1/rental-orders/batch creates orders from the selected address', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/rental-orders/batch')
      .send({
        cartItemIds: ['40000000-0000-0000-0000-000000000001'],
        depositType: 'traditional',
        addressId: '40000000-0000-0000-0000-000000000001',
      })
      .expect(201);

    const body = response.body as {
      data: {
        removedCartItemIds: string[];
        orders: Array<{
          shipping_name: string;
          shipping_phone: string;
          shipping_address: string;
        }>;
      };
    };

    expect(body.data).toMatchObject({
      removedCartItemIds: ['40000000-0000-0000-0000-000000000001'],
    });
    expect(body.data.orders[0]).toMatchObject({
      shipping_name: 'Nguyen Van A',
      shipping_phone: '0987654321',
      shipping_address: '123 Nguyen Hue, Ben Nghe, District 1, HCMC',
    });
  });

  it('GET /api/v1/rental-orders returns filtered pagination at the global meta level', async () => {
    repository.findAll.mockResolvedValue({
      data: [{ id: 'order-id' }],
      total: 1,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/rental-orders?status=confirmed&page=1&limit=10')
      .expect(200);

    expect(repository.findAll).toHaveBeenCalledWith({
      where: { renter_id: 'renter-id' },
      status: OrderStatusType.confirmed,
      page: 1,
      limit: 10,
    });
    expect(response.body).toEqual({
      success: true,
      data: [{ id: 'order-id' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('GET /api/v1/rental-orders/:id returns 403 FORBIDDEN for an unrelated user', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'another-renter',
      lender_id: 'lender-id',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/rental-orders/order-id')
      .expect(403);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this rental order',
      },
    });
  });

  it('PATCH confirm returns 403 FORBIDDEN when called by the renter', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.pending_confirm,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
    expect(escrowService.lock).not.toHaveBeenCalled();
  });

  it('PATCH return returns 403 FORBIDDEN when called by the lender', async () => {
    currentUser = { id: 'lender-id', role: UserRole.renter };
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.active,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/return')
      .send({ fileUrls: ['/uploads/renter-id/return.jpg'] })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('PATCH confirm returns 400 INVALID_TRANSITION from delivering', async () => {
    currentUser = { id: 'lender-id', role: UserRole.renter };
    prismaService.$transaction = jest
      .fn()
      .mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([]),
          rentalOrder: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'order-id',
              lender_id: 'lender-id',
              renter_id: 'renter-id',
              status: OrderStatusType.delivering,
              rental_fee: new Prisma.Decimal(100000),
              deposit_amount: new Prisma.Decimal(500000),
              deposit_type: 'traditional',
            }),
            update: jest.fn(),
          },
        }),
      );

    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_TRANSITION' },
    });
    expect(escrowService.lock).not.toHaveBeenCalled();
  });

  it('exposes the complete transition route sequence', async () => {
    const order: Record<string, unknown> & {
      id: string;
      renter_id: string;
      lender_id: string;
      status: OrderStatusType;
    } = {
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.pending_confirm,
      rental_fee: new Prisma.Decimal(100000),
      deposit_amount: new Prisma.Decimal(500000),
      deposit_type: 'traditional',
    };
    repository.findById.mockImplementation(() => Promise.resolve({ ...order }));
    repository.transition.mockImplementation(
      (
        _id: string,
        expectedStatus: OrderStatusType,
        data: Record<string, unknown> & { status: OrderStatusType },
      ) => {
        if (order.status !== expectedStatus) return Promise.resolve(null);
        Object.assign(order, data);
        return Promise.resolve({ ...order });
      },
    );

    const txOrder = order;
    prismaService.$transaction = jest
      .fn()
      .mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([]),
          rentalOrder: {
            findUnique: jest
              .fn()
              .mockImplementation(() => Promise.resolve({ ...txOrder })),
            update: jest.fn().mockImplementation(({ data }) => {
              Object.assign(txOrder, data);
              return Promise.resolve({ ...txOrder });
            }),
          },
          rentalProof: {
            findFirst: jest.fn().mockResolvedValue(null),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }),
      );

    currentUser = { id: 'lender-id', role: UserRole.renter };
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm')
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/ship')
      .expect(200);

    currentUser = { id: 'renter-id', role: UserRole.renter };
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm-receipt')
      .send({
        fileUrls: ['/uploads/renter-id/received-front.jpg'],
        note: 'Gear nguyên vẹn',
      })
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/return')
      .send({
        fileUrls: ['/uploads/renter-id/return-front.jpg'],
        note: 'Đã đóng gói gear',
      })
      .expect(200);

    currentUser = { id: 'lender-id', role: UserRole.renter };
    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm-return')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: OrderStatusType.completed },
    });
    expect(escrowService.lock).toHaveBeenCalledTimes(1);
  });

  it('exposes the renter cancel route', async () => {
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.pending_confirm,
    });
    repository.transition.mockResolvedValue({
      id: 'order-id',
      status: OrderStatusType.cancelled,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/cancel')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: { status: OrderStatusType.cancelled },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
