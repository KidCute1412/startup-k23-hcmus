/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import {
  DisputeStatusType,
  OrderStatusType,
  Prisma,
  ReporterRoleEnum,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { AdminService } from './admin.service';
import { ResolutionType } from './dto/resolve-dispute.dto';

describe('AdminService dispute resolution', () => {
  const tx = {
    $queryRaw: jest.fn(),
    dispute: { findUnique: jest.fn(), update: jest.fn() },
    rentalOrder: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  const escrow = {
    release: jest.fn(),
    compensate: jest.fn(),
  } as unknown as EscrowService;
  const disputeId = '10000000-0000-0000-0000-000000000001';
  const orderId = '20000000-0000-0000-0000-000000000001';
  const createdAt = new Date('2026-07-27T00:00:00.000Z');
  const openDispute = {
    id: disputeId,
    rental_order_id: orderId,
    reported_by: 'renter-id',
    reporter_role: ReporterRoleEnum.renter,
    reason: 'device_damaged',
    description: null,
    status: DisputeStatusType.open,
    resolved_by: null,
    resolution_note: null,
    resolution_type: null,
    deduct_amount: null,
    created_at: createdAt,
    resolved_at: null,
    rental_order: { id: orderId, status: OrderStatusType.disputed },
  };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prisma, escrow);
    tx.dispute.findUnique.mockResolvedValue(openDispute);
    tx.dispute.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...openDispute,
          ...data,
          deduct_amount:
            typeof data.deduct_amount === 'number'
              ? new Prisma.Decimal(data.deduct_amount)
              : null,
        }),
    );
  });

  it.each([
    [ResolutionType.refund, undefined, 'release'],
    [ResolutionType.deposit_deduct, 500, 'compensate'],
  ] as const)(
    'uses the correct escrow operation for %s and completes the order',
    async (resolutionType, deductAmount, method) => {
      await expect(
        service.resolveDispute(
          disputeId,
          'admin-id',
          resolutionType,
          deductAmount,
          'Reviewed',
        ),
      ).resolves.toMatchObject({
        status: DisputeStatusType.resolved,
        resolutionType,
        deductAmount:
          resolutionType === ResolutionType.refund ? null : deductAmount,
      });
      expect(escrow[method]).toHaveBeenCalled();
      expect(tx.rentalOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: OrderStatusType.completed },
      });
      expect(tx.dispute.update).toHaveBeenCalledWith({
        where: { id: disputeId },
        data: expect.objectContaining({
          status: DisputeStatusType.resolved,
          resolved_by: 'admin-id',
          resolution_type: resolutionType,
          deduct_amount:
            resolutionType === ResolutionType.refund ? null : deductAmount,
        }),
      });
    },
  );

  it('returns persisted resolved data without financial or audit writes', async () => {
    const resolvedAt = new Date('2026-07-27T01:00:00.000Z');
    tx.dispute.findUnique.mockResolvedValueOnce({
      ...openDispute,
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
    expect(escrow.release).not.toHaveBeenCalled();
    expect(escrow.compensate).not.toHaveBeenCalled();
    expect(tx.rentalOrder.update).not.toHaveBeenCalled();
    expect(tx.dispute.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      DisputeStatusType.closed,
      OrderStatusType.disputed,
      'INVALID_DISPUTE_STATUS',
    ],
    [DisputeStatusType.open, OrderStatusType.active, 'INVALID_ORDER_STATUS'],
  ])(
    'rejects invalid dispute/order state',
    async (status, orderStatus, code) => {
      tx.dispute.findUnique.mockResolvedValueOnce({
        ...openDispute,
        status,
        rental_order: { id: orderId, status: orderStatus },
      });
      await expect(
        service.resolveDispute(
          disputeId,
          'admin-id',
          ResolutionType.refund,
          undefined,
          undefined,
        ),
      ).rejects.toMatchObject({ status: 400, response: { error: code } });
      expect(escrow.release).not.toHaveBeenCalled();
    },
  );

  it('preserves escrow errors and transaction rollback', async () => {
    (escrow.compensate as jest.Mock).mockRejectedValueOnce(
      new Error('DEDUCT_EXCEEDS_DEPOSIT'),
    );
    await expect(
      service.resolveDispute(
        disputeId,
        'admin-id',
        ResolutionType.deposit_deduct,
        999,
        undefined,
      ),
    ).rejects.toThrow('DEDUCT_EXCEEDS_DEPOSIT');
    expect(tx.rentalOrder.update).not.toHaveBeenCalled();
    expect(tx.dispute.update).not.toHaveBeenCalled();
  });
});
