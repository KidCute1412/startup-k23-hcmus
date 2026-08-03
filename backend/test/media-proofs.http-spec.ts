import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  OrderStatusType,
  ProofStageEnum,
  ProofTypeEnum,
  UserRole,
} from '@prisma/client';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import type { App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { MediaController } from '../src/modules/media/media.controller';
import { configureStaticUploads } from '../src/modules/media/media-storage';
import { MediaService } from '../src/modules/media/media.service';
import { RentalOrdersRepository } from '../src/modules/rental-orders/rental-orders.repository';
import { RentalProofsController } from '../src/modules/rental-orders/rental-proofs.controller';
import { RentalProofsService } from '../src/modules/rental-orders/rental-proofs.service';

interface UploadResponseBody {
  success: true;
  data: { url: string };
}

function responseBody<T>(response: { body: unknown }): T {
  return response.body as T;
}

describe('Media and rental proofs (HTTP)', () => {
  let app: INestApplication<App>;
  let uploadsRoot: string;
  let originalUploadsDir: string | undefined;
  let currentUser: { id: string; role: UserRole };
  let repository: {
    findProofOrderById: jest.Mock;
    createProof: jest.Mock;
    findProofs: jest.Mock;
  };

  const lenderId = '10000000-0000-0000-0000-000000000001';
  const renterId = '10000000-0000-0000-0000-000000000002';
  const outsiderId = '10000000-0000-0000-0000-000000000003';
  const orderId = '20000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    originalUploadsDir = process.env.UPLOADS_DIR;
    uploadsRoot = mkdtempSync(join(tmpdir(), 'mutux-media-http-'));
    process.env.UPLOADS_DIR = uploadsRoot;
    currentUser = { id: lenderId, role: UserRole.renter };
    repository = {
      findProofOrderById: jest.fn().mockResolvedValue({
        id: orderId,
        renter_id: renterId,
        lender_id: lenderId,
        status: OrderStatusType.confirmed,
      }),
      createProof: jest.fn().mockImplementation((data: object) =>
        Promise.resolve({
          id: 'proof-id',
          uploaded_at: new Date('2026-07-26T00:00:00.000Z'),
          ...data,
        }),
      ),
      findProofs: jest.fn().mockResolvedValue([]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MediaController, RentalProofsController],
      providers: [
        MediaService,
        RentalProofsService,
        { provide: RentalOrdersRepository, useValue: repository },
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

    const nestExpressApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    app = nestExpressApp;
    app.setGlobalPrefix('api/v1');
    configureStaticUploads(nestExpressApp);
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

  it('rejects PDF files with 400 UNSUPPORTED_FILE_TYPE', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .attach('file', Buffer.from('%PDF-1.4'), {
        filename: 'proof.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'UNSUPPORTED_FILE_TYPE' },
    });
  });

  it('rejects files larger than 5MB with 400 FILE_TOO_LARGE', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size must not exceed 5MB',
      },
    });
  });

  it('uploads a supported image and serves the returned static URL', async () => {
    const uploadResponse = await uploadImage('gear-condition.png');
    const uploadBody = responseBody<UploadResponseBody>(uploadResponse);

    expect(uploadBody).toMatchObject({
      success: true,
    });
    expect(uploadBody.data.url).toMatch(
      new RegExp(`^/uploads/${lenderId}/\\d+-gear-condition\\.png$`),
    );

    await request(app.getHttpServer())
      .get(uploadBody.data.url)
      .expect('Content-Type', /image\/png/)
      .expect(200);
  });

  it('returns INVALID_PROOF_STAGE when renter submits pre_shipment', async () => {
    currentUser = { id: renterId, role: UserRole.renter };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .send({
        stage: ProofStageEnum.pre_shipment,
        fileUrl: `/uploads/${renterId}/proof.jpg`,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INVALID_PROOF_STAGE' },
    });
  });

  it('returns INVALID_PROOF_STAGE for post_received while confirmed', async () => {
    currentUser = { id: renterId, role: UserRole.renter };

    const response = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .send({
        stage: ProofStageEnum.post_received,
        fileUrl: `/uploads/${renterId}/proof.jpg`,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INVALID_PROOF_STAGE' },
    });
  });

  it.each(['post', 'get'])(
    'returns FORBIDDEN when a non-participant calls %s proofs',
    async (method) => {
      currentUser = { id: outsiderId, role: UserRole.renter };
      const testRequest = request(app.getHttpServer());
      const response =
        method === 'post'
          ? await testRequest
              .post(`/api/v1/rental-orders/${orderId}/proofs`)
              .send({
                stage: ProofStageEnum.pre_shipment,
                fileUrl: `/uploads/${outsiderId}/proof.jpg`,
              })
              .expect(403)
          : await testRequest
              .get(`/api/v1/rental-orders/${orderId}/proofs`)
              .expect(403);

      expect(response.body).toMatchObject({
        error: { code: 'FORBIDDEN' },
      });
    },
  );

  it('creates an image proof using only server-derived ownership fields', async () => {
    const uploadResponse = await uploadImage('pre-shipment.webp', 'image/webp');
    const uploadBody = responseBody<UploadResponseBody>(uploadResponse);
    const response = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .send({
        stage: ProofStageEnum.pre_shipment,
        fileUrl: uploadBody.data.url,
        note: 'No visible scratches',
      })
      .expect(201);

    expect(repository.createProof).toHaveBeenCalledWith({
      rental_order_id: orderId,
      uploaded_by: lenderId,
      stage: ProofStageEnum.pre_shipment,
      proof_type: ProofTypeEnum.image,
      file_url: uploadBody.data.url,
      note: 'No visible scratches',
    });
    expect(response.body).toMatchObject({
      success: true,
      data: {
        rentalOrderId: orderId,
        uploadedBy: lenderId,
        proofType: ProofTypeEnum.image,
      },
    });
  });

  it('rejects client-supplied proofType because it is server-derived', async () => {
    const uploadResponse = await uploadImage(
      'server-derived.jpg',
      'image/jpeg',
    );
    const uploadBody = responseBody<UploadResponseBody>(uploadResponse);

    await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .send({
        stage: ProofStageEnum.pre_shipment,
        proofType: ProofTypeEnum.video,
        fileUrl: uploadBody.data.url,
      })
      .expect(400);

    expect(repository.createProof).not.toHaveBeenCalled();
  });

  it('rejects a valid upload URL owned by the other participant', async () => {
    const uploadResponse = await uploadImage('lender-only.jpg', 'image/jpeg');
    const uploadBody = responseBody<UploadResponseBody>(uploadResponse);
    currentUser = { id: renterId, role: UserRole.renter };
    repository.findProofOrderById.mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.active,
    });

    const response = await request(app.getHttpServer())
      .post(`/api/v1/rental-orders/${orderId}/proofs`)
      .send({
        stage: ProofStageEnum.post_received,
        fileUrl: uploadBody.data.url,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: { code: 'INVALID_FILE_URL' },
    });
    expect(repository.createProof).not.toHaveBeenCalled();
  });

  async function uploadImage(fileName: string, contentType = 'image/png') {
    return request(app.getHttpServer())
      .post('/api/v1/media/upload')
      .attach('file', Buffer.from('valid-image'), {
        filename: fileName,
        contentType,
      })
      .expect(201);
  }

  afterEach(async () => {
    await app.close();
    if (originalUploadsDir === undefined) {
      delete process.env.UPLOADS_DIR;
    } else {
      process.env.UPLOADS_DIR = originalUploadsDir;
    }
    rmSync(uploadsRoot, { recursive: true, force: true });
  });
});
