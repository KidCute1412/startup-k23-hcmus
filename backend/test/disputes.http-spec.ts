import {
  BadRequestException,
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DisputeReasonEnum } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AdminService } from '../src/modules/admin/admin.service';
import { DisputesService } from '../src/modules/disputes/disputes.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createAccessTokenCookie, createJwt } from './support/integration';

describe('Dispute routes (HTTP)', () => {
  let app: INestApplication<App>;
  const userId = '10000000-0000-4000-8000-000000000001';
  const orderId = '20000000-0000-4000-8000-000000000001';
  const disputeId = '30000000-0000-4000-8000-000000000001';
  const disputesService = {
    create: jest.fn(),
    addResponseEvidence: jest.fn(),
  };
  const adminService = { resolveDispute: jest.fn() };
  const validBody = {
    rentalOrderId: orderId,
    reason: DisputeReasonEnum.device_damaged,
    description: 'Cracked case',
    evidences: [
      {
        mediaType: 'image',
        url: `/uploads/${userId}/evidence.jpg`,
      },
    ],
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'disputes-http-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({ is_active: true }),
        },
      })
      .overrideProvider(DisputesService)
      .useValue(disputesService)
      .overrideProvider(AdminService)
      .useValue(adminService)
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

  beforeEach(() => {
    jest.clearAllMocks();
    disputesService.create.mockResolvedValue({
      id: disputeId,
      rentalOrderId: orderId,
      reportedBy: userId,
      reporterRole: 'renter',
      status: 'open',
      evidences: [],
    });
    disputesService.addResponseEvidence.mockResolvedValue({
      id: disputeId,
      rentalOrderId: orderId,
      status: 'open',
      responseDeadlineAt: '2026-08-01T00:00:00.000Z',
      evidences: [],
    });
    adminService.resolveDispute.mockResolvedValue({
      id: disputeId,
      rentalOrderId: orderId,
      status: 'resolved',
      resolutionType: 'refund',
      deductAmount: null,
    });
  });

  it('requires authentication and returns 201 with the response envelope', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/disputes')
      .set('Origin', 'http://localhost:3000')
      .send(validBody)
      .expect(401);

    const response = await submitDispute(validBody).expect(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        rentalOrderId: orderId,
        reportedBy: userId,
        reporterRole: 'renter',
      },
    });
  });

  it.each([
    [{ ...validBody, rentalOrderId: 'not-a-uuid' }],
    [{ ...validBody, reason: 'invalid_reason' }],
    [{ ...validBody, description: 'x'.repeat(2001) }],
    [{ ...validBody, evidences: Array(6).fill(validBody.evidences[0]) }],
    [{ ...validBody, evidences: [{ mediaType: 'video', url: 'x' }] }],
    [{ ...validBody, evidences: [{ mediaType: 'image', url: '' }] }],
  ])('returns 400 for invalid dispute body %o', async (body) => {
    await submitDispute(body).expect(400);
    expect(disputesService.create).not.toHaveBeenCalled();
  });

  it.each([
    [
      new BadRequestException({
        error: 'INVALID_FILE_URL',
        message: 'Invalid evidence',
      }),
      400,
      'INVALID_FILE_URL',
    ],
    [
      new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Not a participant',
      }),
      403,
      'FORBIDDEN',
    ],
    [
      new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Order not found',
      }),
      404,
      'NOT_FOUND',
    ],
  ])('returns domain error %s', async (exception, status, code) => {
    disputesService.create.mockRejectedValueOnce(exception);
    const response = await submitDispute(validBody).expect(status);
    const body = response.body as unknown as { error: { code: string } };
    expect(body.error.code).toBe(code);
  });

  it('enforces admin access and returns 200 for resolution', async () => {
    const lenderCookie = createAccessTokenCookie(createJwt(userId, 'lender'));
    await request(app.getHttpServer())
      .post(`/api/v1/admin/disputes/${disputeId}/resolve`)
      .set('Cookie', lenderCookie)
      .set('Origin', 'http://localhost:3000')
      .send({ resolutionType: 'refund' })
      .expect(403);

    const adminCookie = createAccessTokenCookie(createJwt(userId, 'admin'));
    const response = await request(app.getHttpServer())
      .post(`/api/v1/admin/disputes/${disputeId}/resolve`)
      .set('Cookie', adminCookie)
      .set('Origin', 'http://localhost:3000')
      .send({ resolutionType: 'refund' })
      .expect(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'resolved', resolutionType: 'refund' },
    });
  });

  it('accepts response evidence from the other participant', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/disputes/${disputeId}/evidence`)
      .set('Cookie', createAccessTokenCookie(createJwt(userId, 'renter')))
      .set('Origin', 'http://localhost:3000')
      .send({
        evidences: [
          { mediaType: 'image', url: `/uploads/${userId}/reply.jpg` },
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: { id: disputeId, responseDeadlineAt: '2026-08-01T00:00:00.000Z' },
    });
    expect(disputesService.addResponseEvidence).toHaveBeenCalledWith(
      userId,
      disputeId,
      {
        evidences: [
          { mediaType: 'image', url: `/uploads/${userId}/reply.jpg` },
        ],
      },
    );
  });

  it.each([
    { evidences: [] },
    { evidences: Array(6).fill({ mediaType: 'image', url: 'x' }) },
    { evidences: [{ mediaType: 'video', url: 'x' }] },
  ])('validates response evidence body %o', async (body) => {
    await request(app.getHttpServer())
      .post(`/api/v1/disputes/${disputeId}/evidence`)
      .set('Cookie', createAccessTokenCookie(createJwt(userId, 'renter')))
      .set('Origin', 'http://localhost:3000')
      .send(body)
      .expect(400);
    expect(disputesService.addResponseEvidence).not.toHaveBeenCalled();
  });

  it.each([
    { resolutionType: 'refund', deductAmount: 1 },
    { resolutionType: 'deposit_deduct' },
    { resolutionType: 'deposit_deduct', deductAmount: 0 },
  ])('returns 400 for invalid resolution body %o', async (body) => {
    const adminCookie = createAccessTokenCookie(createJwt(userId, 'admin'));
    await request(app.getHttpServer())
      .post(`/api/v1/admin/disputes/${disputeId}/resolve`)
      .set('Cookie', adminCookie)
      .set('Origin', 'http://localhost:3000')
      .send(body)
      .expect(400);
    expect(adminService.resolveDispute).not.toHaveBeenCalled();
  });

  function submitDispute(body: object) {
    const cookie = createAccessTokenCookie(createJwt(userId, 'renter'));
    return request(app.getHttpServer())
      .post('/api/v1/disputes')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000')
      .send(body);
  }

  afterAll(async () => {
    await app.close();
  });
});
