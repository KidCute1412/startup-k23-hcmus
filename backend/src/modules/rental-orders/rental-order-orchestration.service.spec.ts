import { OrderStatusType, Prisma, ProofStageEnum } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import {
  RENTAL_ORDER_TRANSITION_MATRIX,
  RentalOrderOrchestrationService,
} from './rental-order-orchestration.service';

describe('RentalOrderOrchestrationService', () => {
  const orderId = '30000000-0000-0000-0000-000000000001';
  const renterId = '00000000-0000-0000-0000-000000000001';
  const lenderId = '00000000-0000-0000-0000-000000000002';

  let service: RentalOrderOrchestrationService;
  let state: Record<string, unknown>;
  let proofs: Set<string>;
  let tx: {
    $queryRaw: jest.Mock;
    rentalOrder: { findUnique: jest.Mock; update: jest.Mock };
    rentalProof: { findFirst: jest.Mock };
  };
  let escrow: { lock: jest.Mock; release: jest.Mock };

  const invoke = (
    action: (typeof RENTAL_ORDER_TRANSITION_MATRIX)[number]['action'],
    userId: string,
  ) => {
    switch (action) {
      case 'confirm':
        return service.confirm(userId, orderId);
      case 'ship':
        return service.ship(userId, orderId);
      case 'cancel':
        return service.cancel(userId, orderId);
      case 'confirm-receipt':
        return service.confirmReceipt(userId, orderId);
      case 'return':
        return service.returnOrder(userId, orderId);
      case 'confirm-return':
        return service.confirmReturn(userId, orderId);
    }
  };

  beforeEach(() => {
    state = {
      id: orderId,
      order_code: 'ORD-TEST',
      renter_id: renterId,
      lender_id: lenderId,
      status: OrderStatusType.pending_confirm,
      rental_fee: new Prisma.Decimal(100_000),
      platform_fee: new Prisma.Decimal(0),
      lender_income: new Prisma.Decimal(0),
    };
    proofs = new Set();
    tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      rentalOrder: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...state })),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(state, data);
          return Promise.resolve({ ...state });
        }),
      },
      rentalProof: {
        findFirst: jest
          .fn()
          .mockImplementation(
            ({
              where,
            }: {
              where: { stage: ProofStageEnum; uploaded_by: string };
            }) =>
              Promise.resolve(
                proofs.has(`${where.stage}:${where.uploaded_by}`)
                  ? { id: 'proof-id' }
                  : null,
              ),
          ),
      },
    };
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (client: typeof tx) => unknown) =>
          callback(tx),
        ),
    };
    escrow = {
      lock: jest.fn().mockResolvedValue({ status: 'locked' }),
      release: jest.fn().mockResolvedValue({ status: 'released' }),
    };
    service = new RentalOrderOrchestrationService(
      prisma as unknown as PrismaService,
      escrow as unknown as EscrowService,
    );
  });

  it('defines the complete Lean MVP transition matrix', () => {
    expect(RENTAL_ORDER_TRANSITION_MATRIX).toEqual([
      expect.objectContaining({
        action: 'confirm',
        actor: 'lender',
        from: OrderStatusType.pending_confirm,
        to: OrderStatusType.confirmed,
      }),
      expect.objectContaining({
        action: 'ship',
        actor: 'lender',
        from: OrderStatusType.confirmed,
        to: OrderStatusType.delivering,
      }),
      expect.objectContaining({
        action: 'cancel',
        actor: 'renter',
        from: OrderStatusType.pending_confirm,
        to: OrderStatusType.cancelled,
      }),
      expect.objectContaining({
        action: 'confirm-receipt',
        actor: 'renter',
        from: OrderStatusType.delivering,
        to: OrderStatusType.active,
      }),
      expect.objectContaining({
        action: 'return',
        actor: 'renter',
        from: OrderStatusType.active,
        to: OrderStatusType.returning,
      }),
      expect.objectContaining({
        action: 'confirm-return',
        actor: 'lender',
        from: OrderStatusType.returning,
        to: OrderStatusType.completed,
      }),
    ]);
  });

  it.each(RENTAL_ORDER_TRANSITION_MATRIX)(
    'allows only the $actor to perform $from -> $to',
    async (rule) => {
      state.status = rule.from;
      for (const stage of rule.requiredProofs ?? []) {
        const uploader =
          stage === ProofStageEnum.pre_shipment ||
          stage === ProofStageEnum.post_returned
            ? lenderId
            : renterId;
        proofs.add(`${stage}:${uploader}`);
      }
      const actorId = rule.actor === 'lender' ? lenderId : renterId;
      const otherId = rule.actor === 'lender' ? renterId : lenderId;

      await expect(invoke(rule.action, otherId)).rejects.toMatchObject({
        status: 403,
        response: { error: 'FORBIDDEN' },
      });
      await expect(invoke(rule.action, actorId)).resolves.toMatchObject({
        status: rule.to,
      });
    },
  );

  it.each(RENTAL_ORDER_TRANSITION_MATRIX)(
    'rejects $action from a status outside its source state',
    async (rule) => {
      state.status = OrderStatusType.disputed;
      const actorId = rule.actor === 'lender' ? lenderId : renterId;

      await expect(invoke(rule.action, actorId)).rejects.toMatchObject({
        status: 400,
        response: {
          error:
            rule.action === 'cancel'
              ? 'CANCEL_NOT_ALLOWED'
              : 'INVALID_TRANSITION',
        },
      });
    },
  );

  it.each(RENTAL_ORDER_TRANSITION_MATRIX)(
    'makes a committed $action retry a no-op',
    async (rule) => {
      state.status = rule.to;
      const actorId = rule.actor === 'lender' ? lenderId : renterId;

      await expect(invoke(rule.action, actorId)).resolves.toMatchObject({
        status: rule.to,
      });
      expect(tx.rentalOrder.update).not.toHaveBeenCalled();
      expect(escrow.lock).not.toHaveBeenCalled();
      expect(escrow.release).not.toHaveBeenCalled();
    },
  );

  it('requires lender pre_shipment proof before ship', async () => {
    state.status = OrderStatusType.confirmed;

    await expect(service.ship(lenderId, orderId)).rejects.toMatchObject({
      status: 400,
      response: { error: 'PROOF_REQUIRED' },
    });
    expect(tx.rentalOrder.update).not.toHaveBeenCalled();
  });

  it('requires both renter pre_return and lender post_returned before settlement', async () => {
    state.status = OrderStatusType.returning;
    proofs.add(`${ProofStageEnum.pre_return}:${renterId}`);

    await expect(
      service.confirmReturn(lenderId, orderId),
    ).rejects.toMatchObject({
      status: 400,
      response: { error: 'PROOF_REQUIRED' },
    });
    expect(escrow.release).not.toHaveBeenCalled();
    expect(tx.rentalOrder.update).not.toHaveBeenCalled();
  });
});
