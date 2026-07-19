import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createFixtureIds,
  createIntegrationApp,
  createJwt,
} from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Admin approval APIs (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId: string;
  let lenderId: string;
  let lenderToken: string;
  let adminToken: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'admin-integration-test-secret';
    ({ app, prisma } = await createIntegrationApp());
    adminId = newId();
    lenderId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          email: `admin-${adminId}@integration.test`,
          password_hash: 'x',
          role: 'admin',
          kyc_status: 'verified',
        },
        {
          id: lenderId,
          email: `lender-${lenderId}@integration.test`,
          password_hash: 'x',
          role: 'lender',
          kyc_status: 'verified',
        },
      ],
    });
    adminToken = createJwt(adminId, 'admin');
    lenderToken = createJwt(lenderId, 'lender');
  });

  it('rejects unauthenticated and non-admin callers', async () => {
    const targetId = newId();
    await prisma.user.create({
      data: {
        id: targetId,
        email: `auth-${targetId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'pending',
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/kyc/${targetId}/approve`)
      .expect(401);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/admin/kyc/${targetId}/approve`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(403);
    const errorBody = response.body as unknown as { error: { code: string } };
    expect(errorBody.error.code).toBe('ADMIN_ONLY');
  });

  it('approves KYC and persists reviewer metadata', async () => {
    const targetId = newId();
    await prisma.user.create({
      data: {
        id: targetId,
        email: `kyc-approve-${targetId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'pending',
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/kyc/${targetId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: targetId } }),
    ).toMatchObject({
      kyc_status: 'verified',
      kyc_reviewed_by: adminId,
      kyc_rejection_reason: null,
    });
  });

  it('rejects KYC and persists the reason', async () => {
    const targetId = newId();
    await prisma.user.create({
      data: {
        id: targetId,
        email: `kyc-reject-${targetId}@integration.test`,
        password_hash: 'x',
        role: 'renter',
        kyc_status: 'pending',
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/kyc/${targetId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Identity document is unreadable' })
      .expect(201);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: targetId } }),
    ).toMatchObject({
      kyc_status: 'rejected',
      kyc_rejection_reason: 'Identity document is unreadable',
      kyc_reviewed_by: adminId,
    });
  });

  it('approves gear, exposes it publicly, and keeps repeat approve idempotent', async () => {
    const gearId = newId();
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Pending gear',
        rent_price_per_day: 100_000,
        approval_status: 'pending',
        status: 'available',
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/gears/${gearId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    const first = await prisma.gear.findUniqueOrThrow({
      where: { id: gearId },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/gears/${gearId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(
      await prisma.gear.findUniqueOrThrow({ where: { id: gearId } }),
    ).toMatchObject({
      approval_status: 'approved',
      approved_by: adminId,
      approved_at: first.approved_at,
    });
    const catalogResponse = await request(app.getHttpServer())
      .get('/api/v1/gears')
      .expect(200);
    const catalogBody = catalogResponse.body as unknown as {
      data: Array<{ id: string }>;
    };
    expect(catalogBody.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: gearId })]),
    );
    await request(app.getHttpServer())
      .get(`/api/v1/gears/${gearId}`)
      .expect(200);
  });

  it('rejects an approved gear and removes it from the public catalog', async () => {
    const gearId = newId();
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Approved gear',
        rent_price_per_day: 100_000,
        approval_status: 'approved',
        status: 'available',
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/gears/${gearId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(
      await prisma.gear.findUniqueOrThrow({ where: { id: gearId } }),
    ).toMatchObject({ approval_status: 'rejected', approved_by: adminId });
    await request(app.getHttpServer())
      .get(`/api/v1/gears/${gearId}`)
      .expect(404);
  });

  it('returns an approved gear to pending when its lender edits it', async () => {
    const gearId = newId();
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Editable gear',
        rent_price_per_day: 100_000,
        approval_status: 'approved',
        status: 'available',
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/gears/${gearId}`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .send({ name: 'Edited gear' })
      .expect(200);
    expect(
      await prisma.gear.findUniqueOrThrow({ where: { id: gearId } }),
    ).toMatchObject({
      name: 'Edited gear',
      approval_status: 'pending',
      approved_by: null,
      approved_at: null,
    });
    await request(app.getHttpServer())
      .get(`/api/v1/gears/${gearId}`)
      .expect(404);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.gear.deleteMany({ where: { id: { in: fixtureIds } } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    }
    await app?.close();
  });
});
