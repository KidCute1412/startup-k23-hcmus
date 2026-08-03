import type { INestApplication } from '@nestjs/common';
import { OrderStatusType, ProofStageEnum, ProofTypeEnum } from '@prisma/client';
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

interface UploadResponseBody {
  data: { url: string };
}

interface ProofResponseBody {
  data: { id: string };
}

interface ProofListResponseBody {
  data: Array<{ id: string }>;
}

function responseBody<T>(response: { body: unknown }): T {
  return response.body as T;
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = testDatabaseUrl ? describe : describe.skip;

describeIntegration('Rental proof APIs (PostgreSQL integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let uploadsRoot: string;
  let originalUploadsDir: string | undefined;
  let lenderId: string;
  let renterId: string;
  let outsiderId: string;
  let gearId: string;
  let orderId: string;
  let lenderToken: string;
  let renterToken: string;
  let outsiderToken: string;
  const { ids: fixtureIds, newId } = createFixtureIds();

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'rental-proof-integration-test-secret';
    originalUploadsDir = process.env.UPLOADS_DIR;
    uploadsRoot = mkdtempSync(join(tmpdir(), 'mutux-proof-integration-'));
    process.env.UPLOADS_DIR = uploadsRoot;
    ({ app, prisma } = await createIntegrationApp());

    lenderId = newId();
    renterId = newId();
    outsiderId = newId();
    gearId = newId();
    orderId = newId();

    await prisma.user.createMany({
      data: [
        {
          id: lenderId,
          email: `proof-lender-${lenderId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          lender_enabled: true,
          kyc_status: 'verified',
        },
        {
          id: renterId,
          email: `proof-renter-${renterId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
        {
          id: outsiderId,
          email: `proof-outsider-${outsiderId}@integration.test`,
          password_hash: 'x',
          role: 'renter',
          kyc_status: 'verified',
        },
      ],
    });
    await prisma.gear.create({
      data: {
        id: gearId,
        lender_id: lenderId,
        name: 'Proof integration gear',
        rent_price_per_day: 100_000,
        value: 500_000,
        approval_status: 'approved',
        status: 'available',
      },
    });
    await prisma.rentalOrder.create({
      data: {
        id: orderId,
        order_code: `PROOF-${orderId}`,
        renter_id: renterId,
        lender_id: lenderId,
        gear_id: gearId,
        start_date: new Date('2026-08-01T00:00:00.000Z'),
        end_date: new Date('2026-08-02T00:00:00.000Z'),
        duration_days: 1,
        snapped_rent_price_per_day: 100_000,
        rental_fee: 100_000,
        base_rental_fee: 100_000,
        deposit_amount: 500_000,
        status: OrderStatusType.confirmed,
      },
    });

    lenderToken = createJwt(lenderId, 'lender');
    renterToken = createJwt(renterId, 'renter');
    outsiderToken = createJwt(outsiderId, 'renter');
  });

  it('persists owned uploads, enforces participants/stages, serves files, and lists oldest first', async () => {
    const lenderUpload = await uploadImage(
      lenderToken,
      'before-shipment.jpg',
      'image/jpeg',
    );
    const lenderFileUrl =
      responseBody<UploadResponseBody>(lenderUpload).data.url;
    await request(app.getHttpServer()).get(lenderFileUrl).expect(200);

    const createdPreShipment = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({
        stage: ProofStageEnum.pre_shipment,
        fileUrl: lenderFileUrl,
        note: 'Packed with all accessories',
      })
      .expect(201);
    const preShipmentProofId =
      responseBody<ProofResponseBody>(createdPreShipment).data.id;

    expect(
      await prisma.rentalProof.findUniqueOrThrow({
        where: { id: preShipmentProofId },
      }),
    ).toMatchObject({
      rental_order_id: orderId,
      uploaded_by: lenderId,
      stage: ProofStageEnum.pre_shipment,
      proof_type: ProofTypeEnum.image,
      file_url: lenderFileUrl,
    });

    const invalidActor = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({
        stage: ProofStageEnum.pre_shipment,
        fileUrl: `/uploads/${renterId}/not-used.jpg`,
      })
      .expect(400);
    expect(invalidActor.body).toMatchObject({
      error: { code: 'INVALID_PROOF_STAGE' },
    });

    for (const method of ['post', 'get'] as const) {
      const testRequest = request(app.getHttpServer());
      const response =
        method === 'post'
          ? await testRequest
              .post(`/api/v1/rental-orders/${orderId}/proofs`)
              .set('Cookie', createAccessTokenCookie(outsiderToken))
              .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
              .send({
                stage: ProofStageEnum.pre_shipment,
                fileUrl: `/uploads/${outsiderId}/not-used.jpg`,
              })
              .expect(403)
          : await testRequest
              .get(`/api/v1/rental-orders/${orderId}/proofs`)
              .set('Cookie', createAccessTokenCookie(outsiderToken))
              .expect(403);
      expect(response.body).toMatchObject({
        error: { code: 'FORBIDDEN' },
      });
    }

    await prisma.rentalOrder.update({
      where: { id: orderId },
      data: { status: OrderStatusType.active },
    });

    const stolenFileResponse = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({
        stage: ProofStageEnum.post_received,
        fileUrl: lenderFileUrl,
      })
      .expect(400);
    expect(stolenFileResponse.body).toMatchObject({
      error: { code: 'INVALID_FILE_URL' },
    });

    const renterUpload = await uploadImage(
      renterToken,
      'after-received.webp',
      'image/webp',
    );
    const renterFileUrl =
      responseBody<UploadResponseBody>(renterUpload).data.url;
    const createdPostReceived = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .set('Cookie', createAccessTokenCookie(renterToken))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .send({
        stage: ProofStageEnum.post_received,
        fileUrl: renterFileUrl,
      })
      .expect(201);
    const postReceivedProofId =
      responseBody<ProofResponseBody>(createdPostReceived).data.id;

    await prisma.rentalProof.update({
      where: { id: preShipmentProofId },
      data: { uploaded_at: new Date('2026-07-02T00:00:00.000Z') },
    });
    await prisma.rentalProof.update({
      where: { id: postReceivedProofId },
      data: { uploaded_at: new Date('2026-07-01T00:00:00.000Z') },
    });

    const listResponse = await request(app.getHttpServer())
      .get(`/api/v1/rental-orders/${orderId}/proofs`)
      .set('Cookie', createAccessTokenCookie(lenderToken))
      .expect(200);
    const listBody = responseBody<ProofListResponseBody>(listResponse);

    expect(listBody.data.map((proof) => proof.id)).toEqual([
      postReceivedProofId,
      preShipmentProofId,
    ]);
  });

  async function uploadImage(
    token: string,
    fileName: string,
    contentType: string,
  ) {
    return request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .set('Cookie', createAccessTokenCookie(token))
      .set('Origin', INTEGRATION_FRONTEND_ORIGIN)
      .attach('file', Buffer.from('integration-image'), {
        filename: fileName,
        contentType,
      })
      .expect(201);
  }

  afterAll(async () => {
    if (prisma) {
      await prisma.rentalOrder.deleteMany({
        where: { id: { in: fixtureIds } },
      });
      await prisma.gear.deleteMany({ where: { id: { in: fixtureIds } } });
      await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } });
    }
    await app?.close();
    if (originalUploadsDir === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = originalUploadsDir;
    }
    if (uploadsRoot) {
      rmSync(uploadsRoot, { recursive: true, force: true });
    }
  });
});
