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
  ProofTypeEnum,
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

interface ProofUpload {
  stage: ProofStageEnum;
  fileUrls: string[];
  note?: string;
}

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
    return this.transition(userId, orderId, 'confirm', (tx) =>
      this.escrowService.lock(orderId, tx),
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

  confirmReceiptWithProof(
    userId: string,
    orderId: string,
    fileUrls: string[],
    note?: string,
  ) {
    return this.transition(
      userId,
      orderId,
      'confirm-receipt',
      undefined,
      undefined,
      { stage: ProofStageEnum.post_received, fileUrls, note },
    );
  }

  returnOrder(userId: string, orderId: string) {
    return this.transition(userId, orderId, 'return');
  }

  returnWithProof(
    userId: string,
    orderId: string,
    fileUrls: string[],
    note?: string,
  ) {
    return this.transition(userId, orderId, 'return', undefined, undefined, {
      stage: ProofStageEnum.pre_return,
      fileUrls,
      note,
    });
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
    proofUpload?: ProofUpload,
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

      if (
        action === 'ship' &&
        order.ship_deadline_at &&
        new Date() > order.ship_deadline_at
      ) {
        await this.escrowService.refundLateDelivery(orderId, tx);
        return tx.rentalOrder.update({
          where: { id: orderId },
          data: {
            status: OrderStatusType.cancelled,
            cancelled_reason: 'late_delivery_refund',
          },
        });
      }

      await this.assertRequiredProofs(tx, order, rule);
      if (proofUpload) {
        await this.assertNoExistingProof(tx, order.id, proofUpload.stage);
        await tx.rentalProof.createMany({
          data: proofUpload.fileUrls.map((fileUrl) => ({
            rental_order_id: order.id,
            uploaded_by: userId,
            stage: proofUpload.stage,
            proof_type: ProofTypeEnum.image,
            file_url: fileUrl,
            note: proofUpload.note,
          })),
        });
      }
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

  private async assertNoExistingProof(
    tx: Prisma.TransactionClient,
    orderId: string,
    stage: ProofStageEnum,
  ): Promise<void> {
    const exists = await tx.rentalProof.findFirst({
      where: { rental_order_id: orderId, stage },
      select: { id: true },
    });
    if (exists) {
      throw new BadRequestException({
        error: 'PROOF_STAGE_ALREADY_SUBMITTED',
        message: `Proof stage ${stage} has already been submitted`,
      });
    }
  }
}
