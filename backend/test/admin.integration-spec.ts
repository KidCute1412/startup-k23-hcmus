/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createFixtureIds,
  createAccessTokenCookie,
  createIntegrationApp,
  createJwt,
  INTEGRATION_FRONTEND_ORIGIN,
} from './support/integration';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Admin approval APIs (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId: string;
  let lenderId: string;
  let otherLenderId: string;
  let renterId: string;
  let lenderToken: string;
  let renterToken: string;
  let adminToken: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'admin-integration-test-secret';
    ({ app, prisma } = await createIntegrationApp());
    adminId = newId();
    lenderId = newId();
    otherLenderId = newId();
    renterId = newId();
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
        {
          id: otherLenderId,
          email: `other-lender-${otherLenderId}@integration.test`,
          password_hash: 'x',
          role: 'lender',
          kyc_status: 'verified',
        },
        {
          id: renterId,
          email: `renter-${renterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
      ],
    });
    adminToken = createJwt(adminId, 'admin');
    lenderToken = createJwt(lenderId, 'lender');
    renterToken = createJwt(renterId, 'renter');
  });

  it('rejects unauthenticated, renter, and lender callers on every admin route', async () => {
    const targetId = newId();
    const getPaths = ['/api/v1/admin/kyc', '/api/v1/admin/gears'];
    const postPaths = [
      `/api/v1/admin/kyc/${targetId}/approve`,
      `/api/v1/admin/kyc/${targetId}/reject`,
      `/api/v1/admin/gears/${targetId}/approve`,
      `/api/v1/admin/gears/${targetId}/reject`,
    ];

    for (const path of getPaths) {
      await request(app.getHttpServer()).get(path).expect(401);
      for (const token of [renterToken, lenderToken]) {
        const response = await request(app.getHttpServer())
          .get(path)
          .set('Cookie', createAccessTokenCookie(token))
          .expect(403);
        expect(response.body).toMatchObject({
          success: false,
          error: { code: 'ADMIN_ONLY' },
        });
      }
    }

    for (const path of postPaths) {
      await request(app.getHttpServer())
        .post(path)
        .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
        .expect(401);
      for (const token of [renterToken, lenderToken]) {
        const response = await request(app.getHttpServer())
          .post(path)
          .set('Cookie', createAccessTokenCookie(token))
          .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
          .expect(403);
        expect(response.body).toMatchObject({
          success: false,
          error: { code: 'ADMIN_ONLY' },
        });
      }
    }
  });

  it('paginates and filters the KYC and gear queues', async () => {
    const pendingUserId = newId();
    const rejectedUserId = newId();
    await prisma.user.createMany({
      data: [
        {
          id: pendingUserId,
          email: `queue-pending-${pendingUserId}@integration.test`,
          password_hash: 'secret-that-must-not-leak',
          cccd: '012345678912',
          kyc_front_card_url: `/uploads/${pendingUserId}/front.jpg`,
          kyc_back_card_url: `/uploads/${pendingUserId}/back.jpg`,
          kyc_portrait_url: `/uploads/${pendingUserId}/portrait.jpg`,
          role: 'renter',
          kyc_status: 'pending',
        },
        {
          id: rejectedUserId,
          email: `queue-rejected-${rejectedUserId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'rejected',
        },
      ],
    });
    const pendingGearId = newId();
    const rejectedGearId = newId();
    await prisma.gear.createMany({
      data: [
        {
          id: pendingGearId,
          lender_id: lenderId,
          name: 'Queue pending gear',
          rent_price_per_day: 100_000,
          approval_status: 'pending',
        },
        {
          id: rejectedGearId,
          lender_id: lenderId,
          name: 'Queue rejected gear',
          rent_price_per_day: 100_000,
          approval_status: 'rejected',
        },
      ],
    });

    const kycResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/kyc?page=1&limit=1')
      .set('Cookie', createAccessTokenCookie(adminToken))
      .expect(200);
    expect(kycResponse.body.meta).toMatchObject({
      page: 1,
      limit: 1,
      totalPages: expect.any(Number),
    });
    expect(kycResponse.body.data).toHaveLength(1);
    expect(kycResponse.body.data[0]).toMatchObject({
      kyc_status: 'pending',
    });
    expect(kycResponse.body.data[0]).not.toHaveProperty('password_hash');

    const rejectedKycResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/kyc?status=rejected&page=1&limit=100')
      .set('Cookie', createAccessTokenCookie(adminToken))
      .expect(200);
    expect(rejectedKycResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: rejectedUserId,
          kyc_status: 'rejected',
        }),
      ]),
    );

    const gearResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/gears?approvalStatus=pending&page=1&limit=100')
      .set('Cookie', createAccessTokenCookie(adminToken))
      .expect(200);
    expect(gearResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pendingGearId,
          approval_status: 'pending',
        }),
      ]),
    );
    expect(gearResponse.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: rejectedGearId })]),
    );

    await request(app.getHttpServer())
      .get('/api/v1/admin/kyc?status=invalid')
      .set('Cookie', createAccessTokenCookie(adminToken))
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/admin/gears?approvalStatus=invalid')
      .set('Cookie', createAccessTokenCookie(adminToken))
      .expect(400);
  });

  it('returns all own gear states from gears/mine without leaking another lender', async () => {
    const ownIds = [newId(), newId(), newId()];
    const otherGearId = newId();
    await prisma.gear.createMany({
      data: [
        {
          id: ownIds[0],
          lender_id: lenderId,
          name: 'Own pending gear',
          rent_price_per_day: 100_000,
          approval_status: 'pending',
          status: 'available',
        },
        {
          id: ownIds[1],
          lender_id: lenderId,
          name: 'Own rejected gear',
          rent_price_per_day: 100_000,
          approval_status: 'rejected',
          status: 'available',
        },
        {
          id: ownIds[2],
          lender_id: lenderId,
          name: 'Own delisted gear',
          rent_price_per_day: 100_000,
          approval_status: 'approved',
          status: 'delisted',
        },
        {
          id: otherGearId,
          lender_id: otherLenderId,
          name: 'Other lender gear',
          rent_price_per_day: 100_000,
          approval_status: 'pending',
          status: 'available',
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/gears/mine?page=1&limit=100')
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .expect(200);
    expect(response.body.data.map((gear: { id: string }) => gear.id)).toEqual(
      expect.arrayContaining(ownIds),
    );
    expect(response.body.data).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: otherGearId })]),
    );
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 100,
      totalPages: expect.any(Number),
    });
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
        credit_consent_accepted_at: new Date(),
      },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/kyc/${targetId}/approve`)
      .set('Cookie', createAccessTokenCookie(adminToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(201);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: targetId } }),
    ).toMatchObject({
      kyc_status: 'verified',
      kyc_reviewed_by: adminId,
      kyc_rejection_reason: null,
    });
    const wallet = await prisma.mutuxWallet.findUniqueOrThrow({
      where: { user_id: targetId },
    });
    expect(wallet.total_limit.toNumber()).toBe(3_000_000);
    expect(wallet.display_balance.toNumber()).toBe(3_000_000);
    await expect(
      prisma.creditTransaction.count({
        where: {
          mutux_wallet_id: wallet.id,
          type: 'limit_granted',
          ref_type: 'kyc_verification',
          ref_id: targetId,
        },
      }),
    ).resolves.toBe(1);
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
      .set('Cookie', createAccessTokenCookie(adminToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
      .set('Cookie', createAccessTokenCookie(adminToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .expect(201);
    const first = await prisma.gear.findUniqueOrThrow({
      where: { id: gearId },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/gears/${gearId}/approve`)
      .set('Cookie', createAccessTokenCookie(adminToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
      .set('Cookie', createAccessTokenCookie(adminToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
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
