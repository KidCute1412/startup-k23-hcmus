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
  UserRole,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { RentalOrdersController } from '../src/modules/rental-orders/rental-orders.controller';
import { RentalOrdersRepository } from '../src/modules/rental-orders/rental-orders.repository';
import { RentalOrdersService } from '../src/modules/rental-orders/rental-orders.service';

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
  let escrowService: { lock: jest.Mock };

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
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RentalOrdersController],
      providers: [
        RentalOrdersService,
        { provide: RentalOrdersRepository, useValue: repository },
        { provide: EscrowService, useValue: escrowService },
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
        startDate: '2026-08-01',
        endDate: '2026-08-06',
        depositType: 'credit_line',
        shippingAddress: '123 Nguyen Hue, District 1, HCMC',
        shippingName: 'Nguyen Van A',
        shippingPhone: '0987654321',
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
    currentUser = { id: 'lender-id', role: UserRole.lender };
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.active,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/return')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('PATCH confirm returns 400 INVALID_TRANSITION from delivering', async () => {
    currentUser = { id: 'lender-id', role: UserRole.lender };
    repository.findById.mockResolvedValue({
      id: 'order-id',
      renter_id: 'renter-id',
      lender_id: 'lender-id',
      status: OrderStatusType.delivering,
    });

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

    currentUser = { id: 'lender-id', role: UserRole.lender };
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm')
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/ship')
      .expect(200);

    currentUser = { id: 'renter-id', role: UserRole.renter };
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/confirm-receipt')
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/rental-orders/order-id/return')
      .expect(200);

    currentUser = { id: 'lender-id', role: UserRole.lender };
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
