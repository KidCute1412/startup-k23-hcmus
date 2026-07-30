import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatusType,
  Prisma,
  ProofStageEnum,
  type RentalOrder,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';

type TransitionActor = 'renter' | 'lender';
type TimestampField =
  | 'lender_shipped_at'
  | 'renter_received_at'
  | 'renter_returned_at'
  | 'lender_received_back_at';

interface TransitionRule {
  action:
    | 'confirm'
    | 'ship'
    | 'cancel'
    | 'confirm-receipt'
    | 'return'
    | 'confirm-return';
  actor: TransitionActor;
  from: OrderStatusType;
  to: OrderStatusType;
  timestampField?: TimestampField;
  requiredProofs?: readonly ProofStageEnum[];
}

type LockedOrder = RentalOrder;
const PLATFORM_FEE_RATE = 0.15;

export const RENTAL_ORDER_TRANSITION_MATRIX: readonly TransitionRule[] = [
  {
    action: 'confirm',
    actor: 'lender',
    from: OrderStatusType.pending_confirm,
    to: OrderStatusType.confirmed,
  },
  {
    action: 'ship',
    actor: 'lender',
    from: OrderStatusType.confirmed,
    to: OrderStatusType.delivering,
    timestampField: 'lender_shipped_at',
    requiredProofs: [ProofStageEnum.pre_shipment],
  },
  {
    action: 'cancel',
    actor: 'renter',
    from: OrderStatusType.pending_confirm,
    to: OrderStatusType.cancelled,
  },
  {
    action: 'confirm-receipt',
    actor: 'renter',
    from: OrderStatusType.delivering,
    to: OrderStatusType.active,
    timestampField: 'renter_received_at',
  },
  {
    action: 'return',
    actor: 'renter',
    from: OrderStatusType.active,
    to: OrderStatusType.returning,
    timestampField: 'renter_returned_at',
  },
  {
    action: 'confirm-return',
    actor: 'lender',
    from: OrderStatusType.returning,
    to: OrderStatusType.completed,
    timestampField: 'lender_received_back_at',
    requiredProofs: [ProofStageEnum.pre_return, ProofStageEnum.post_returned],
  },
] as const;

@Injectable()
export class RentalOrderOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  confirm(userId: string, orderId: string) {
    return this.transition(
      userId,
      orderId,
      'confirm',
      (tx) => this.escrowService.lock(orderId, tx),
      (order) => {
        const platformFee = order.rental_fee.mul(PLATFORM_FEE_RATE);
        return {
          platform_fee: platformFee,
          lender_income: order.rental_fee.sub(platformFee),
        };
      },
    );
  }

  ship(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'ship');
  }

  cancel(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'cancel');
  }

  confirmReceipt(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'confirm-receipt');
  }

  returnOrder(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'return');
  }

  confirmReturn(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'confirm-return', (tx) =>
      this.escrowService.release(orderId, tx),
    );
  }

  private transition(
    userId: string,
    orderId: string,
    action: TransitionRule['action'],
    financialSideEffect?: (
      tx: Prisma.TransactionClient,
      order: LockedOrder,
    ) => Promise<unknown>,
    additionalUpdateData?: (
      order: LockedOrder,
    ) => Prisma.RentalOrderUpdateInput,
  ) {
    const rule = RENTAL_ORDER_TRANSITION_MATRIX.find(
      (candidate) => candidate.action === action,
    );
    if (!rule) {
      throw new Error(`Missing transition rule for ${action}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${orderId}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({
        where: { id: orderId },
      });
      if (!order) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Rental order not found',
        });
      }

      this.assertActor(userId, order, rule.actor);

      // A network retry after a committed request is a successful no-op.
      if (order.status === rule.to) return order;

      if (order.status !== rule.from) {
        if (action === 'cancel') {
          throw new BadRequestException({
            error: 'CANCEL_NOT_ALLOWED',
            message: `Cannot cancel rental order from status ${order.status}`,
          });
        }
        throw new BadRequestException({
          error: 'INVALID_TRANSITION',
          message: `Cannot ${action} rental order from status ${order.status}`,
        });
      }

      await this.assertRequiredProofs(tx, order, rule);
      await financialSideEffect?.(tx, order);

      const data: Prisma.RentalOrderUpdateInput = {
        status: rule.to,
        ...additionalUpdateData?.(order),
        ...(rule.timestampField ? { [rule.timestampField]: new Date() } : {}),
      };
      return tx.rentalOrder.update({
        where: { id: orderId },
        data,
      });
    });
  }

  private assertActor(
    userId: string,
    order: LockedOrder,
    actor: TransitionActor,
  ): void {
    const expectedUserId =
      actor === 'lender' ? order.lender_id : order.renter_id;
    if (expectedUserId !== userId) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: `Only the order ${actor} can perform this transition`,
      });
    }
  }

  private async assertRequiredProofs(
    tx: Prisma.TransactionClient,
    order: LockedOrder,
    rule: TransitionRule,
  ): Promise<void> {
    for (const stage of rule.requiredProofs ?? []) {
      const uploadedBy =
        stage === ProofStageEnum.pre_shipment ||
        stage === ProofStageEnum.post_returned
          ? order.lender_id
          : order.renter_id;
      const exists = await tx.rentalProof.findFirst({
        where: {
          rental_order_id: order.id,
          stage,
          uploaded_by: uploadedBy,
        },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException({
          error: 'PROOF_REQUIRED',
          message: `Proof ${stage} is required before ${rule.action}`,
        });
      }
    }
  }
}
