import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { createAccessTokenCookie, createJwt } from './support/integration';

describe('Admin and lender management routes (HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    gear: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'admin-http-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
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

  it('returns 401 without a token and ADMIN_ONLY for a lender', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/kyc').expect(401);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/gears')
      .set('Cookie', createAccessTokenCookie(createJwt('lender-id', 'lender')))
      .expect(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ADMIN_ONLY' },
    });
  });

  it('validates queue statuses and wraps pagination metadata', async () => {
    const cookie = createAccessTokenCookie(createJwt('admin-id', 'admin'));
    await request(app.getHttpServer())
      .get('/api/v1/admin/kyc?status=invalid')
      .set('Cookie', cookie)
      .expect(400);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/gears?page=1&limit=10')
      .set('Cookie', cookie)
      .expect(200);
    expect(response.body).toEqual({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    });
  });

  it('protects gears/mine with JWT authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/gears/mine').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
