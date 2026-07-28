import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createAccessTokenCookie,
  createFixtureIds,
  createIntegrationApp,
  createJwt,
  INTEGRATION_FRONTEND_ORIGIN,
} from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error: {
    code: string;
  };
};

describeIntegration(
  'Account profile and addresses (PostgreSQL integration)',
  () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let uploadsRoot: string;
    const { ids, newId } = createFixtureIds();
    const userId = newId();
    const password = 'CurrentPassword123';
    let cookie: string;

    beforeAll(async () => {
      process.env.DATABASE_URL = testDatabaseUrl;
      uploadsRoot = mkdtempSync(join(tmpdir(), 'mutux-account-integration-'));
      process.env.UPLOADS_DIR = uploadsRoot;
      ({ app, prisma } = await createIntegrationApp());
      await prisma.user.create({
        data: {
          id: userId,
          email: `account-${userId}@test.local`,
          password_hash: await bcrypt.hash(password, 4),
          full_name: 'Account Integration',
          role: 'renter',
        },
      });
      cookie = createAccessTokenCookie(createJwt(userId, 'renter'));
    });

    it('reads and updates a safe camelCase profile', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Cookie', cookie)
        .expect(200);
      const getBody = getResponse.body as unknown as ApiEnvelope<
        Record<string, unknown>
      >;
      expect(getBody.data).toMatchObject({
        id: userId,
        fullName: 'Account Integration',
        kycStatus: 'unverified',
      });
      expect(getBody.data).not.toHaveProperty('password_hash');
      expect(getBody.data).not.toHaveProperty('hashedRefreshToken');

      const updateResponse = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          fullName: 'Account Updated',
          phone: '0908123456',
          dob: '1999-05-15',
          bio: 'Integration profile',
        })
        .expect(200);
      const updateBody = updateResponse.body as unknown as ApiEnvelope<
        Record<string, unknown>
      >;
      expect(updateBody.data).toMatchObject({
        fullName: 'Account Updated',
        phone: '0908123456',
        dob: '1999-05-15',
        bio: 'Integration profile',
      });
    });

    it('maintains one default address across CRUD operations', async () => {
      const first = await createAddress('Home', false);
      const second = await createAddress('Office', true);

      let list = await listAddresses();
      expect(list.filter((address) => address.isDefault)).toHaveLength(1);
      expect(list.find((address) => address.isDefault)?.id).toBe(second.id);

      await request(app.getHttpServer())
        .patch(`/api/v1/users/me/addresses/${first.id}/default`)
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .expect(200);
      list = await listAddresses();
      expect(list.find((address) => address.isDefault)?.id).toBe(first.id);

      await request(app.getHttpServer())
        .delete(`/api/v1/users/me/addresses/${first.id}`)
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .expect(200);
      list = await listAddresses();
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ id: second.id, isDefault: true });
    });

    it('accepts owned KYC uploads and rejects a duplicate pending submission', async () => {
      const [front, back, portrait] = await Promise.all([
        uploadImage('front.jpg'),
        uploadImage('back.jpg'),
        uploadImage('portrait.jpg'),
      ]);
      const body = {
        cccd: '012345678912',
        frontCardUrl: front,
        backCardUrl: back,
        portraitUrl: portrait,
      };
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/kyc')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send(body)
        .expect(200);
      const responseBody = response.body as unknown as ApiEnvelope<
        Record<string, unknown>
      >;
      expect(responseBody.data).toMatchObject({ kycStatus: 'pending' });

      const duplicate = await request(app.getHttpServer())
        .post('/api/v1/users/me/kyc')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send(body)
        .expect(409);
      const duplicateBody = duplicate.body as unknown as ApiErrorEnvelope;
      expect(duplicateBody.error.code).toBe('KYC_ALREADY_PENDING');
    });

    it('soft-closes the account and invalidates the existing access token', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({ password })
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Cookie', cookie)
        .expect(401);
      await expect(
        prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { is_active: true },
        }),
      ).resolves.toEqual({ is_active: false });
    });

    async function createAddress(label: string, isDefault: boolean) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/addresses')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .send({
          receiverName: label,
          phone: '0908123456',
          detailAddress: `${label} street`,
          ward: 'Ward 1',
          district: 'District 1',
          province: 'Ho Chi Minh City',
          isDefault,
        })
        .expect(201);
      return (
        response.body as unknown as ApiEnvelope<{
          id: string;
          isDefault: boolean;
        }>
      ).data;
    }

    async function listAddresses() {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me/addresses')
        .set('Cookie', cookie)
        .expect(200);
      return (
        response.body as unknown as ApiEnvelope<
          Array<{ id: string; isDefault: boolean }>
        >
      ).data;
    }

    async function uploadImage(fileName: string) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/media/upload')
        .set('Cookie', cookie)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .attach('file', Buffer.from('valid-image'), {
          filename: fileName,
          contentType: 'image/jpeg',
        })
        .expect(201);
      return (
        response.body as unknown as ApiEnvelope<{
          url: string;
        }>
      ).data.url;
    }

    afterAll(async () => {
      await prisma?.user.deleteMany({ where: { id: { in: ids } } });
      await app?.close();
      delete process.env.UPLOADS_DIR;
      if (uploadsRoot) rmSync(uploadsRoot, { recursive: true, force: true });
    });
  },
);
