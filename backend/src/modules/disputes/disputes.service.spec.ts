/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import {
  DisputeReasonEnum,
  DisputeStatusType,
  OrderStatusType,
  ReporterRoleEnum,
} from '@prisma/client';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DisputesService } from './disputes.service';

describe('DisputesService', () => {
  const renterId = '10000000-0000-0000-0000-000000000001';
  const lenderId = '10000000-0000-0000-0000-000000000002';
  const orderId = '20000000-0000-0000-0000-000000000001';
  const now = new Date('2026-07-27T00:00:00.000Z');
  const orderModel = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const disputeModel = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const rootDisputeModel = {
    findFirst: jest.fn(),
  };
  const tx = {
    $queryRaw: jest.fn(),
    rentalOrder: orderModel,
    dispute: disputeModel,
  };
  const prisma = {
    rentalOrder: { findUnique: jest.fn() },
    dispute: rootDisputeModel,
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  const media = {
    assertOwnedImageFile: jest.fn(),
  } as unknown as MediaService;
  let service: DisputesService;

  const dto = {
    rentalOrderId: orderId,
    reason: DisputeReasonEnum.device_damaged,
    description: 'Cracked case',
    evidences: [
      {
        mediaType: 'image' as const,
        url: `/uploads/${renterId}/damage.jpg`,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DisputesService(prisma, media);
    (prisma.rentalOrder.findUnique as jest.Mock).mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
    });
    orderModel.findUnique.mockResolvedValue({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.active,
    });
    disputeModel.findFirst.mockResolvedValue(null);
    rootDisputeModel.findFirst.mockResolvedValue(null);
    (media.assertOwnedImageFile as jest.Mock).mockImplementation(
      (_userId: string, url: string) => Promise.resolve(url),
    );
    disputeModel.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...data,
          id: 'dispute-id',
          rental_order_id: orderId,
          reported_by: renterId,
          reporter_role: ReporterRoleEnum.renter,
          reason: dto.reason,
          description: dto.description,
          status: DisputeStatusType.open,
          resolved_by: null,
          resolution_note: null,
          resolution_type: null,
          deduct_amount: null,
          created_at: now,
          resolved_at: null,
          evidences: [
            {
              id: 'evidence-id',
              uploaded_by: renterId,
              media_type: 'image',
              url: dto.evidences[0].url,
              uploaded_at: now,
            },
          ],
        }),
    );
  });

  it.each([
    [renterId, ReporterRoleEnum.renter],
    [lenderId, ReporterRoleEnum.lender],
  ])(
    'derives the %s participant role and creates evidence atomically',
    async (userId, role) => {
      const request = {
        ...dto,
        evidences: [
          {
            ...dto.evidences[0],
            url: `/uploads/${userId}/damage.jpg`,
          },
        ],
      };
      disputeModel.create.mockImplementationOnce(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            ...data,
            id: 'dispute-id',
            rental_order_id: orderId,
            reported_by: userId,
            reporter_role: role,
            reason: dto.reason,
            description: dto.description,
            status: DisputeStatusType.open,
            resolved_by: null,
            resolution_note: null,
            resolution_type: null,
            deduct_amount: null,
            created_at: now,
            resolved_at: null,
            evidences: [],
          }),
      );

      await expect(service.create(userId, request)).resolves.toMatchObject({
        rentalOrderId: orderId,
        reportedBy: userId,
        reporterRole: role,
      });
      expect(disputeModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reported_by: userId,
          reporter_role: role,
          evidences: {
            create: [
              {
                uploaded_by: userId,
                media_type: 'image',
                url: request.evidences[0].url,
              },
            ],
          },
        }),
        include: { evidences: true },
      });
      expect(orderModel.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatusType.disputed },
      });
    },
  );

  it('rejects non-participants before validating evidence', async () => {
    await expect(
      service.create('30000000-0000-0000-0000-000000000001', dto),
    ).rejects.toMatchObject({
      status: 403,
      response: { error: 'FORBIDDEN' },
    });
    expect(media.assertOwnedImageFile).not.toHaveBeenCalled();
  });

  it('rejects missing orders and invalid locked stages', async () => {
    (prisma.rentalOrder.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.create(renterId, dto)).rejects.toMatchObject({
      status: 404,
    });

    orderModel.findUnique.mockResolvedValueOnce({
      id: orderId,
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.completed,
    });
    await expect(service.create(renterId, dto)).rejects.toMatchObject({
      status: 400,
      response: { error: 'DISPUTE_NOT_ALLOWED_AT_THIS_STAGE' },
    });
  });

  it('returns the existing active dispute under the order lock on retry', async () => {
    disputeModel.findFirst.mockResolvedValueOnce({
      id: 'existing',
      rental_order_id: orderId,
      reported_by: renterId,
      reporter_role: ReporterRoleEnum.renter,
      reason: dto.reason,
      description: dto.description,
      status: DisputeStatusType.open,
      resolved_by: null,
      resolution_note: null,
      resolution_type: null,
      deduct_amount: null,
      created_at: now,
      resolved_at: null,
      evidences: [],
    });
    await expect(service.create(renterId, dto)).resolves.toMatchObject({
      id: 'existing',
      status: DisputeStatusType.open,
    });
    expect(disputeModel.create).not.toHaveBeenCalled();
    expect(orderModel.update).not.toHaveBeenCalled();
  });

  it('does not start a transaction when evidence ownership fails', async () => {
    (media.assertOwnedImageFile as jest.Mock).mockRejectedValueOnce(
      new Error('invalid file'),
    );
    await expect(service.create(renterId, dto)).rejects.toThrow('invalid file');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('leaves the order update inside the transaction for rollback safety', async () => {
    orderModel.update.mockRejectedValueOnce(new Error('update failed'));
    await expect(service.create(renterId, dto)).rejects.toThrow(
      'update failed',
    );
    expect(disputeModel.create).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
