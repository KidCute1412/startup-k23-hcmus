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
  let walletsService: {
    checkout: jest.Mock;
    completeTopup: jest.Mock;
    getRenter: jest.Mock;
    webhook: jest.Mock;
  };

  beforeEach(async () => {
    walletsService = {
      checkout: jest.fn(),
      completeTopup: jest.fn(),
      getRenter: jest.fn(),
      webhook: jest.fn(),
    };

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
          testRequest.user = { id: 'renter-id', role: 'renter' };
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
      .send({ amount: 0 })
      .expect(400);

    expect(walletsService.checkout).not.toHaveBeenCalled();
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
      .send({ orderCode: 123 })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'INVALID_SIGNATURE', message: 'INVALID_SIGNATURE' },
    });
    expect(walletsService.webhook).toHaveBeenCalledWith(
      { orderCode: 123 },
      'bad-signature',
      expect.any(Buffer),
    );
  });

  it('POST /api/v1/wallets/topups/:id/simulate-success returns the current topup', async () => {
    walletsService.completeTopup.mockResolvedValueOnce({
      id: 'topup-id',
      status: 'success',
      amount: '100000',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/wallets/topups/topup-id/simulate-success')
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: { id: 'topup-id', status: 'success' },
    });
    expect(walletsService.completeTopup).toHaveBeenCalledWith(
      'topup-id',
      'renter-id',
    );
  });
});
