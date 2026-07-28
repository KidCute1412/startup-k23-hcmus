import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/modules/users/users.service';
import { createAccessTokenCookie, createJwt } from './support/integration';

describe('Account routes (HTTP)', () => {
  let app: INestApplication<App>;
  const userId = '00000000-0000-0000-0000-000000000006';
  const profile = {
    id: userId,
    email: 'renter@example.com',
    fullName: 'Renter Demo',
    role: 'renter',
    kycStatus: 'unverified',
  };
  const usersService = {
    findOne: jest.fn().mockResolvedValue(profile),
    updateProfile: jest.fn().mockResolvedValue(profile),
    closeAccount: jest.fn().mockResolvedValue({ closed: true }),
    submitKyc: jest.fn().mockResolvedValue({
      ...profile,
      kycStatus: 'pending',
    }),
    listAddresses: jest.fn().mockResolvedValue([]),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    setDefaultAddress: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ is_active: true }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'users-http-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(UsersService)
      .useValue(usersService)
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

  it('protects account routes and returns the safe profile wrapper', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    const cookie = createAccessTokenCookie(createJwt(userId, 'renter'));
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', cookie)
      .expect(200);
    const responseBody = response.body as unknown as {
      success: boolean;
      data: typeof profile;
    };
    expect(response.body).toEqual({ success: true, data: profile });
    expect(responseBody.data).not.toHaveProperty('password_hash');
  });

  it('validates profile and KYC payloads at the HTTP boundary', async () => {
    const cookie = createAccessTokenCookie(createJwt(userId, 'renter'));
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000')
      .send({ phone: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/users/me/kyc')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000')
      .send({ cccd: '012345678912' })
      .expect(400);
  });

  it('registers address CRUD and account closure routes', async () => {
    const cookie = createAccessTokenCookie(createJwt(userId, 'renter'));
    await request(app.getHttpServer())
      .get('/api/v1/users/me/addresses')
      .set('Cookie', cookie)
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/users/me')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000')
      .send({ password: 'CurrentPassword123' })
      .expect(200);
    expect(usersService.closeAccount).toHaveBeenCalledWith(userId, {
      password: 'CurrentPassword123',
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
