import { OrderStatusType, ProofStageEnum, ProofTypeEnum } from '@prisma/client';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RentalOrdersRepository } from './rental-orders.repository';
import { RentalProofsService } from './rental-proofs.service';

describe('RentalProofsService', () => {
  let service: RentalProofsService;
  let repository: {
    findProofOrderById: jest.Mock;
    createProof: jest.Mock;
    findProofs: jest.Mock;
  };
  let mediaService: { assertOwnedImageFile: jest.Mock };

  const orderId = 'order-id';
  const renterId = 'renter-id';
  const lenderId = 'lender-id';
  const fileUrl = `/uploads/${lenderId}/proof.jpg`;

  beforeEach(() => {
    repository = {
      findProofOrderById: jest.fn(),
      createProof: jest.fn().mockImplementation((data: object) =>
        Promise.resolve({
          id: 'proof-id',
          uploaded_at: new Date('2026-07-26T00:00:00.000Z'),
          ...data,
        }),
      ),
      findProofs: jest.fn().mockResolvedValue([]),
    };
    mediaService = {
      assertOwnedImageFile: jest
        .fn()
        .mockImplementation((_userId: string, url: string) =>
          Promise.resolve(url),
        ),
    };
    service = new RentalProofsService(
      repository as unknown as RentalOrdersRepository,
      mediaService as unknown as MediaService,
    );
  });

  it.each([
    {
      stage: ProofStageEnum.pre_shipment,
      actorId: lenderId,
      status: OrderStatusType.confirmed,
    },
    {
      stage: ProofStageEnum.post_received,
      actorId: renterId,
      status: OrderStatusType.active,
    },
    {
      stage: ProofStageEnum.pre_return,
      actorId: renterId,
      status: OrderStatusType.returning,
    },
    {
      stage: ProofStageEnum.post_returned,
      actorId: lenderId,
      status: OrderStatusType.returning,
    },
  ])(
    'creates image proof for $stage with the server-derived fields',
    async ({ stage, actorId, status }) => {
      repository.findProofOrderById.mockResolvedValue({
        id: orderId,
        renter_id: renterId,
        lender_id: lenderId,
        status,
      });
      const actorFileUrl = `/uploads/${actorId}/proof.jpg`;

      const result = await service.create(actorId, orderId, {
        stage,
        fileUrl: actorFileUrl,
        note: 'Gear condition',
      });

      expect(repository.createProof).toHaveBeenCalledWith({
        rental_order_id: orderId,
        uploaded_by: actorId,
        stage,
        proof_type: ProofTypeEnum.image,
        file_url: actorFileUrl,
        note: 'Gear condition',
      });
      expect(result).toMatchObject({
        rentalOrderId: orderId,
        uploadedBy: actorId,
        proofType: ProofTypeEnum.image,
        stage,
        fileUrl: actorFileUrl,
      });
    },
  );

  it('returns INVALID_PROOF_STAGE when renter submits pre_shipment', async () => {
    repository.findProofOrderById.mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.confirmed,
    });

    await expect(
      service.create(renterId, orderId, {
        stage: ProofStageEnum.pre_shipment,
        fileUrl,
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_PROOF_STAGE' },
    });
    expect(mediaService.assertOwnedImageFile).not.toHaveBeenCalled();
  });

  it('returns INVALID_PROOF_STAGE when post_received is submitted before active', async () => {
    repository.findProofOrderById.mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.confirmed,
    });

    await expect(
      service.create(renterId, orderId, {
        stage: ProofStageEnum.post_received,
        fileUrl: `/uploads/${renterId}/proof.jpg`,
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_PROOF_STAGE' },
    });
  });

  it.each(['create', 'list'])(
    'returns FORBIDDEN when a non-participant tries to %s proofs',
    async (operation) => {
      repository.findProofOrderById.mockResolvedValue({
        id: orderId,
        renter_id: renterId,
        lender_id: lenderId,
        status: OrderStatusType.confirmed,
      });

      const action =
        operation === 'create'
          ? service.create('outsider-id', orderId, {
              stage: ProofStageEnum.pre_shipment,
              fileUrl,
            })
          : service.findAll('outsider-id', orderId);

      await expect(action).rejects.toMatchObject({
        status: 403,
        response: { error: 'FORBIDDEN' },
      });
    },
  );

  it('does not create a proof when file ownership validation fails', async () => {
    repository.findProofOrderById.mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.confirmed,
    });
    mediaService.assertOwnedImageFile.mockRejectedValue({
      status: 400,
      response: { error: 'INVALID_FILE_URL' },
    });

    await expect(
      service.create(lenderId, orderId, {
        stage: ProofStageEnum.pre_shipment,
        fileUrl,
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'INVALID_FILE_URL' },
    });
    expect(repository.createProof).not.toHaveBeenCalled();
  });
});

describe('RentalProofsService batch upload', () => {
  const orderId = 'batch-order-id';
  const lenderId = 'batch-lender-id';
  let service: RentalProofsService;
  let tx: {
    $queryRaw: jest.Mock;
    rentalOrder: { findUnique: jest.Mock };
    rentalProof: {
      findFirst: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let mediaService: { assertOwnedImageFile: jest.Mock };

  beforeEach(() => {
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      rentalOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: orderId,
          renter_id: 'batch-renter-id',
          lender_id: lenderId,
          status: OrderStatusType.confirmed,
        }),
      },
      rentalProof: {
        findFirst: jest.fn().mockResolvedValue(null),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'batch-proof-1',
            rental_order_id: orderId,
            uploaded_by: lenderId,
            stage: ProofStageEnum.pre_shipment,
            proof_type: ProofTypeEnum.image,
            file_url: `/uploads/${lenderId}/front.jpg`,
            note: 'Đủ phụ kiện',
            uploaded_at: new Date('2026-07-29T00:00:00.000Z'),
          },
          {
            id: 'batch-proof-2',
            rental_order_id: orderId,
            uploaded_by: lenderId,
            stage: ProofStageEnum.pre_shipment,
            proof_type: ProofTypeEnum.image,
            file_url: `/uploads/${lenderId}/back.jpg`,
            note: 'Đủ phụ kiện',
            uploaded_at: new Date('2026-07-29T00:00:01.000Z'),
          },
        ]),
      },
    };
    mediaService = {
      assertOwnedImageFile: jest.fn((_userId: string, url: string) =>
        Promise.resolve(url),
      ),
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;
    service = new RentalProofsService(
      {
        findProofOrderById: jest.fn().mockResolvedValue({
          id: orderId,
          renter_id: 'batch-renter-id',
          lender_id: lenderId,
          status: OrderStatusType.confirmed,
        }),
      } as unknown as RentalOrdersRepository,
      mediaService as unknown as MediaService,
      prisma,
    );
  });

  it('uploads multiple images in one stage and returns all proofs', async () => {
    const result = await service.createBatch(lenderId, orderId, {
      stage: ProofStageEnum.pre_shipment,
      fileUrls: [
        `/uploads/${lenderId}/front.jpg`,
        `/uploads/${lenderId}/back.jpg`,
      ],
      note: 'Đủ phụ kiện',
    });

    const createManyCall = tx.rentalProof.createMany.mock
      .calls[0] as unknown as [{ data: Array<{ file_url: string }> }];
    expect(createManyCall[0].data.map(({ file_url }) => file_url)).toEqual([
      `/uploads/${lenderId}/front.jpg`,
      `/uploads/${lenderId}/back.jpg`,
    ]);
    expect(result).toHaveLength(2);
    expect(mediaService.assertOwnedImageFile).toHaveBeenCalledTimes(2);
  });

  it('rejects a second batch for the same stage', async () => {
    tx.rentalProof.findFirst.mockResolvedValue({ id: 'existing-proof' });

    await expect(
      service.createBatch(lenderId, orderId, {
        stage: ProofStageEnum.pre_shipment,
        fileUrls: [`/uploads/${lenderId}/again.jpg`],
      }),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'PROOF_STAGE_ALREADY_SUBMITTED' },
    });
    expect(tx.rentalProof.createMany).not.toHaveBeenCalled();
  });
});
