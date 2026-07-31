/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  DisputeStatusType,
  OrderStatusType,
  Prisma,
  ReporterRoleEnum,
  DisputeReasonEnum,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { AdminService } from './admin.service';
import { ResolutionType } from './dto/resolve-dispute.dto';

describe('AdminService — resolveDispute', () => {
  const disputeId = '10000000-0000-0000-0000-000000000001';
  const orderId = '20000000-0000-0000-0000-000000000001';
  const adminId = '30000000-0000-0000-0000-000000000001';
  const renterId = '40000000-0000-0000-0000-000000000001';
  const createdAt = new Date('2026-07-27T00:00:00.000Z');

  let prisma: PrismaService;
  let escrowService: { release: jest.Mock; compensate: jest.Mock };
  let service: AdminService;
  let mockTx: {
    $queryRaw: jest.Mock;
    dispute: { findUnique: jest.Mock; update: jest.Mock };
    rentalOrder: { update: jest.Mock };
  };

  const sampleDispute = {
    id: disputeId,
    rental_order_id: orderId,
    reported_by: renterId,
    reporter_role: ReporterRoleEnum.renter,
    reason: DisputeReasonEnum.device_damaged,
    description: 'Cracked screen',
    status: DisputeStatusType.open,
    resolved_by: null,
    resolution_note: null,
    resolution_type: null,
    deduct_amount: null,
    created_at: createdAt,
    resolved_at: null,
    rental_order: {
      id: orderId,
      status: OrderStatusType.disputed,
    },
  };

  beforeEach(() => {
    mockTx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      dispute: {
        findUnique: jest.fn().mockResolvedValue({ ...sampleDispute }),
        update: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: { deduct_amount?: number | null } }) =>
              Promise.resolve({
                ...sampleDispute,
                ...data,
                deduct_amount:
                  data.deduct_amount != null
                    ? new Prisma.Decimal(data.deduct_amount)
                    : null,
              }),
          ),
      },
      rentalOrder: {
        update: jest.fn().mockResolvedValue({
          id: orderId,
          status: OrderStatusType.completed,
        }),
      },
    };

    prisma = {
      $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    } as unknown as PrismaService;

    escrowService = {
      release: jest.fn().mockResolvedValue({ status: 'released' }),
      compensate: jest.fn().mockResolvedValue({ status: 'compensated' }),
    };

    service = new AdminService(
      prisma,
      escrowService as unknown as EscrowService,
    );
  });

  it('resolves dispute with resolutionType = refund by calling EscrowService.release(orderId)', async () => {
    const result = await service.resolveDispute(
      disputeId,
      adminId,
      ResolutionType.refund,
      undefined,
      'Full refund issued',
    );

    expect(escrowService.release).toHaveBeenCalledWith(orderId, mockTx);
    expect(escrowService.compensate).not.toHaveBeenCalled();
    expect(mockTx.rentalOrder.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: { status: OrderStatusType.completed },
    });
    expect(result).toMatchObject({
      id: disputeId,
      status: 'resolved',
      resolvedBy: adminId,
      resolutionType: 'refund',
      deductAmount: null,
      resolutionNote: 'Full refund issued',
    });
  });

  it('resolves dispute with resolutionType = deposit_deduct by calling EscrowService.compensate(orderId, deductAmount)', async () => {
    const deductAmount = 150000;
    const result = await service.resolveDispute(
      disputeId,
      adminId,
      ResolutionType.deposit_deduct,
      deductAmount,
      'Deducted for screen crack',
    );

    expect(escrowService.compensate).toHaveBeenCalledWith(
      orderId,
      deductAmount,
      mockTx,
    );
    expect(escrowService.release).not.toHaveBeenCalled();
    expect(mockTx.rentalOrder.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: { status: OrderStatusType.completed },
    });
    expect(result).toMatchObject({
      id: disputeId,
      status: 'resolved',
      resolvedBy: adminId,
      resolutionType: 'deposit_deduct',
      deductAmount: 150000,
      resolutionNote: 'Deducted for screen crack',
    });
  });

  it.each([
    [ResolutionType.refund, undefined, 'release'],
    [ResolutionType.no_action, undefined, 'release'],
    [ResolutionType.deposit_deduct, 500, 'compensate'],
  ] as const)(
    'uses the correct escrow operation for %s and completes the order',
    async (resolutionType, deductAmount, method) => {
      await expect(
        service.resolveDispute(
          disputeId,
          adminId,
          resolutionType,
          deductAmount,
          'Reviewed',
        ),
      ).resolves.toMatchObject({
        status: DisputeStatusType.resolved,
        resolutionType,
        deductAmount:
          resolutionType === ResolutionType.deposit_deduct
            ? deductAmount
            : null,
      });
      expect(escrowService[method]).toHaveBeenCalled();
      expect(mockTx.rentalOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatusType.completed },
      });
      expect(mockTx.dispute.update).toHaveBeenCalledWith({
        where: { id: disputeId },
        data: expect.objectContaining({
          status: DisputeStatusType.resolved,
          resolved_by: adminId,
          resolution_type: resolutionType,
          deduct_amount:
            resolutionType === ResolutionType.deposit_deduct
              ? deductAmount
              : null,
        }),
        include: {
          rental_order: true,
        },
      });
    },
  );

  it('throws INVALID_DEDUCT_AMOUNT if resolutionType = deposit_deduct and deductAmount is undefined', async () => {
    await expect(
      service.resolveDispute(
        disputeId,
        adminId,
        ResolutionType.deposit_deduct,
        undefined,
        'Note',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(escrowService.compensate).not.toHaveBeenCalled();
  });

  it('returns persisted resolved data without financial or audit writes', async () => {
    const resolvedAt = new Date('2026-07-27T01:00:00.000Z');
    mockTx.dispute.findUnique.mockResolvedValueOnce({
      ...sampleDispute,
      status: DisputeStatusType.resolved,
      resolved_by: 'first-admin',
      resolution_type: ResolutionType.refund,
      resolved_at: resolvedAt,
    });
    await expect(
      service.resolveDispute(
        disputeId,
        'second-admin',
        ResolutionType.refund,
        undefined,
        undefined,
      ),
    ).resolves.toMatchObject({
      resolvedBy: 'first-admin',
      resolvedAt,
    });
    expect(escrowService.release).not.toHaveBeenCalled();
    expect(escrowService.compensate).not.toHaveBeenCalled();
    expect(mockTx.rentalOrder.update).not.toHaveBeenCalled();
    expect(mockTx.dispute.update).not.toHaveBeenCalled();
  });

  it('rolls back transaction when EscrowService.compensate throws DEDUCT_EXCEEDS_DEPOSIT', async () => {
    escrowService.compensate.mockRejectedValueOnce(
      new BadRequestException({
        error: 'DEDUCT_EXCEEDS_DEPOSIT',
        message: 'Deduct amount 5000000 exceeds deposit 1000000',
      }),
    );

    await expect(
      service.resolveDispute(
        disputeId,
        adminId,
        ResolutionType.deposit_deduct,
        5000000,
        'Too high deduction',
      ),
    ).rejects.toMatchObject({
      response: { error: 'DEDUCT_EXCEEDS_DEPOSIT' },
    });

    expect(mockTx.dispute.update).not.toHaveBeenCalled();
    expect(mockTx.rentalOrder.update).not.toHaveBeenCalled();
  });

  it('rolls back transaction when EscrowService.release throws unexpected error', async () => {
    escrowService.release.mockRejectedValueOnce(
      new Error('Unexpected wallet failure'),
    );

    await expect(
      service.resolveDispute(
        disputeId,
        adminId,
        ResolutionType.refund,
        undefined,
        'Refund note',
      ),
    ).rejects.toThrow('Unexpected wallet failure');

    expect(mockTx.dispute.update).not.toHaveBeenCalled();
    expect(mockTx.rentalOrder.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      DisputeStatusType.closed,
      OrderStatusType.disputed,
      'INVALID_DISPUTE_STATUS',
    ],
    [DisputeStatusType.open, OrderStatusType.active, 'INVALID_ORDER_STATUS'],
  ])(
    'rejects invalid dispute/order state: status=%s orderStatus=%s',
    async (status, orderStatus, code) => {
      mockTx.dispute.findUnique.mockResolvedValueOnce({
        ...sampleDispute,
        status,
        rental_order: { id: orderId, status: orderStatus },
      });
      await expect(
        service.resolveDispute(
          disputeId,
          adminId,
          ResolutionType.refund,
          undefined,
          undefined,
        ),
      ).rejects.toMatchObject({ status: 400, response: { error: code } });
      expect(escrowService.release).not.toHaveBeenCalled();
    },
  );

  it('throws NOT_FOUND when dispute does not exist', async () => {
    mockTx.dispute.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveDispute(
        'missing-id',
        adminId,
        ResolutionType.refund,
        undefined,
        'Note',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
