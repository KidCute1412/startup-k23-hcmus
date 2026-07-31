/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { WalletsController } from '../src/modules/wallets/wallets.controller';
import { WalletsService } from '../src/modules/wallets/wallets.service';

describe('WalletsController (HTTP)', () => {
  let app: INestApplication<App>;
  let authenticatedRole: 'renter' | 'lender' | 'admin';
  let walletsService: {
    checkout: jest.Mock;
    completeTopup: jest.Mock;
    getRenter: jest.Mock;
    getMutux: jest.Mock;
    getLender: jest.Mock;
    webhook: jest.Mock;
    withdraw: jest.Mock;
  };

  beforeEach(async () => {
    walletsService = {
      checkout: jest.fn(),
      completeTopup: jest.fn(),
      getRenter: jest.fn(),
      getMutux: jest.fn(),
      getLender: jest.fn(),
      webhook: jest.fn(),
      withdraw: jest.fn(),
    };
    authenticatedRole = 'renter';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: walletsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const testRequest = context
            .switchToHttp()
            .getRequest<{ user: { id: string; role: string } }>();
          testRequest.user = {
            id: `${authenticatedRole}-id`,
            role: authenticatedRole,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>({
      rawBody: true,
    });
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

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/wallets/topups/checkout rejects amount = 0 with 400 validation error', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .send({ amount: 0, method: 'payos' })
      .expect(400);

    expect(walletsService.checkout).not.toHaveBeenCalled();
  });

  it('POST /api/v1/wallets/topups/checkout returns the exact 201 checkout contract', async () => {
    walletsService.checkout.mockResolvedValueOnce({
      topupId: 'topup-id',
      orderCode: 123456,
      amount: 500000,
      status: 'pending',
      paymentInstructions: {
        bankCode: 'MB',
        accountNumber: '999988886666',
        accountName: 'MUTUX DEMO',
        transferContent: 'MUTUX 123456',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .send({ amount: 500000, method: 'payos' })
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        topupId: 'topup-id',
        orderCode: 123456,
        status: 'pending',
      }),
    });
    expect(walletsService.checkout).toHaveBeenCalledWith(
      'renter-id',
      500000,
      'payos',
    );
  });

  it('POST /api/v1/payments/webhook/payos returns INVALID_SIGNATURE when HMAC verification fails', async () => {
    walletsService.webhook.mockRejectedValueOnce(
      new UnauthorizedException({
        error: 'INVALID_SIGNATURE',
        message: 'INVALID_SIGNATURE',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/payos')
      .set('x-payos-signature', 'bad-signature')
      .send({
        code: '00',
        success: true,
        data: { orderCode: 123, amount: 100000, reference: 'ref-1' },
      })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: 'INVALID_SIGNATURE' },
    });
    expect(walletsService.webhook).toHaveBeenCalledWith(
      {
        code: '00',
        success: true,
        data: { orderCode: 123, amount: 100000, reference: 'ref-1' },
      },
      'bad-signature',
    );
  });

  it('POST /api/v1/wallets/topups/:id/simulate-success returns the current topup', async () => {
    walletsService.completeTopup.mockResolvedValueOnce({
      topupId: 'topup-id',
      status: 'success',
      walletBalance: 100000,
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/topup-id/simulate-success')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        topupId: 'topup-id',
        status: 'success',
        walletBalance: 100000,
      },
    });
    expect(walletsService.completeTopup).toHaveBeenCalledWith(
      'topup-id',
      'renter-id',
    );
  });

  it('POST /api/v1/wallets/lender/withdraw creates a pending withdrawal', async () => {
    authenticatedRole = 'lender';
    walletsService.withdraw.mockResolvedValueOnce({
      id: 'withdrawal-id',
      status: 'pending',
      amount: 100000,
      balance: 400000,
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/wallets/lender/withdraw')
      .send({
        amount: 100000,
        bankCode: 'MB',
        accountNumber: '123456789',
        accountHolder: 'NGUYEN VAN A',
      })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        id: 'withdrawal-id',
        status: 'pending',
        amount: 100000,
        balance: 400000,
      },
    });
    expect(walletsService.withdraw).toHaveBeenCalledWith(
      'lender-id',
      expect.objectContaining({ amount: 100000 }),
    );
  });

  it.each(['renter', 'admin'] as const)(
    'returns 403 and never calls withdrawal service for %s',
    async (role) => {
      authenticatedRole = role;

      const response = await request(app.getHttpServer())
        .post('/api/v1/wallets/lender/withdraw')
        .send({
          amount: 100000,
          bankCode: 'MB',
          accountNumber: '123456789',
          accountHolder: 'NGUYEN VAN A',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
      expect(walletsService.withdraw).not.toHaveBeenCalled();
    },
  );

  it('prevents lenders from reading or topping up a renter wallet', async () => {
    authenticatedRole = 'lender';

    await request(app.getHttpServer())
      .get('/api/v1/wallets/renter')
      .expect(403);
    await request(app.getHttpServer()).get('/api/v1/wallets/mutux').expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/checkout')
      .send({ amount: 500000, method: 'payos' })
      .expect(403);

    expect(walletsService.getRenter).not.toHaveBeenCalled();
    expect(walletsService.getMutux).not.toHaveBeenCalled();
    expect(walletsService.checkout).not.toHaveBeenCalled();
  });
});
