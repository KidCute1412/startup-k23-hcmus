import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatusType,
  KycStatusType,
  DisputeStatusType,
  OrderStatusType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetGearQueueQueryDto } from './dto/get-gear-queue-query.dto';
import { GetKycQueueQueryDto } from './dto/get-kyc-queue-query.dto';
import { EscrowService } from '../escrow/escrow.service';
import { ResolutionType } from './dto/resolve-dispute.dto';

const kycUserSelect = {
  id: true,
  email: true,
  full_name: true,
  cccd: true,
  role: true,
  kyc_status: true,
  kyc_rejection_reason: true,
  kyc_reviewed_by: true,
  kyc_reviewed_at: true,
  created_at: true,
  updated_at: true,
  credit_consent_accepted_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  async getKycQueue(query: GetKycQueueQueryDto) {
    const { status, page, limit } = query;
    const where: Prisma.UserWhereInput = { kyc_status: status };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: kycUserSelect,
        orderBy: [{ updated_at: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGearQueue(query: GetGearQueueQueryDto) {
    const { approvalStatus, page, limit } = query;
    const where: Prisma.GearWhereInput = {
      approval_status: approvalStatus,
    };
    const [data, total] = await Promise.all([
      this.prisma.gear.findMany({
        where,
        orderBy: [{ updated_at: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.gear.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveKyc(userId: string, adminId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: kycUserSelect,
      });
      if (!user) throw new NotFoundException('User not found');
      if (
        user.kyc_status !== KycStatusType.pending &&
        user.kyc_status !== KycStatusType.verified
      ) {
        this.invalidKycTransition(user.kyc_status, KycStatusType.verified);
      }
      if (
        user.kyc_status === KycStatusType.pending &&
        user.role === 'renter' &&
        !user.credit_consent_accepted_at
      ) {
        throw new ConflictException({
          error: 'CREDIT_CONSENT_REQUIRED',
          message: 'Renter credit consent is required before KYC approval',
        });
      }

      let verified = user;
      if (user.kyc_status === KycStatusType.pending) {
        await tx.user.updateMany({
          where: { id: userId, kyc_status: KycStatusType.pending },
          data: {
            kyc_status: KycStatusType.verified,
            kyc_rejection_reason: null,
            kyc_reviewed_by: adminId,
            kyc_reviewed_at: new Date(),
          },
        });
        verified = (await tx.user.findUnique({
          where: { id: userId },
          select: kycUserSelect,
        }))!;
      }
      if (verified.role !== 'renter') return verified;

      let wallet = await tx.mutuxWallet.findUnique({
        where: { user_id: userId },
      });
      if (!wallet) {
        wallet = await tx.mutuxWallet.create({
          data: {
            user_id: userId,
            total_limit: 3_000_000,
            display_balance: 3_000_000,
            locked_balance: 0,
            outstanding_debt: 0,
            approved_at: new Date(),
            expired_at: null,
          },
        });
      } else if (
        wallet.total_limit.equals(0) &&
        wallet.locked_balance.equals(0) &&
        wallet.outstanding_debt.equals(0)
      ) {
        wallet = await tx.mutuxWallet.update({
          where: { id: wallet.id },
          data: {
            total_limit: 3_000_000,
            display_balance: 3_000_000,
            approved_at: wallet.approved_at ?? new Date(),
            expired_at: null,
          },
        });
      }
      const existingGrant = await tx.creditTransaction.findFirst({
        where: {
          mutux_wallet_id: wallet.id,
          type: 'limit_granted',
          ref_type: 'kyc_verification',
          ref_id: userId,
        },
      });
      if (!existingGrant && wallet.total_limit.equals(3_000_000)) {
        await tx.creditTransaction.create({
          data: {
            mutux_wallet_id: wallet.id,
            type: 'limit_granted',
            amount: 3_000_000,
            display_balance_before: 0,
            display_balance_after: wallet.display_balance,
            direction: 'in',
            ref_type: 'kyc_verification',
            ref_id: userId,
            note: 'Automatic credit grant after KYC verification',
            status: 'success',
          },
        });
      }
      return verified;
    });

    try {
      await this.prisma.notification.create({
        data: {
          user_id: userId,
          title: 'KYC đã được xác minh',
          body:
            result.role === 'renter'
              ? 'Bạn đã được cấp hạn mức tín dụng Mutux 3.000.000đ.'
              : 'Hồ sơ KYC của bạn đã được xác minh.',
          type: 'kyc_verified',
          ref_type: 'user',
          ref_id: userId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Could not create KYC approval notification for ${userId}: ${String(error)}`,
      );
    }
    return result;
  }

  async rejectKyc(userId: string, adminId: string, reason?: string) {
    const user = await this.requireUser(userId);
    if (user.kyc_status === KycStatusType.rejected) return user;
    if (user.kyc_status !== KycStatusType.pending) {
      this.invalidKycTransition(user.kyc_status, KycStatusType.rejected);
    }

    await this.prisma.user.updateMany({
      where: { id: userId, kyc_status: KycStatusType.pending },
      data: {
        kyc_status: KycStatusType.rejected,
        kyc_rejection_reason: reason ?? null,
        kyc_reviewed_by: adminId,
        kyc_reviewed_at: new Date(),
      },
    });

    const current = await this.requireUser(userId);
    if (current.kyc_status === KycStatusType.rejected) return current;
    return this.invalidKycTransition(
      current.kyc_status,
      KycStatusType.rejected,
    );
  }

  async approveGear(gearId: string, adminId: string) {
    const gear = await this.requireGear(gearId);
    if (gear.approval_status === ApprovalStatusType.approved) return gear;
    if (gear.approval_status !== ApprovalStatusType.pending) {
      this.invalidGearTransition(
        gear.approval_status,
        ApprovalStatusType.approved,
      );
    }

    await this.prisma.gear.updateMany({
      where: {
        id: gearId,
        approval_status: ApprovalStatusType.pending,
      },
      data: {
        approval_status: ApprovalStatusType.approved,
        approved_by: adminId,
        approved_at: new Date(),
      },
    });

    const current = await this.requireGear(gearId);
    if (current.approval_status === ApprovalStatusType.approved) return current;
    return this.invalidGearTransition(
      current.approval_status,
      ApprovalStatusType.approved,
    );
  }

  async rejectGear(gearId: string, adminId: string) {
    const gear = await this.requireGear(gearId);
    if (gear.approval_status === ApprovalStatusType.rejected) return gear;

    await this.prisma.gear.updateMany({
      where: {
        id: gearId,
        approval_status: {
          in: [ApprovalStatusType.pending, ApprovalStatusType.approved],
        },
      },
      data: {
        approval_status: ApprovalStatusType.rejected,
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
    const current = await this.requireGear(gearId);
    if (current.approval_status === ApprovalStatusType.rejected) return current;
    return this.invalidGearTransition(
      current.approval_status,
      ApprovalStatusType.rejected,
    );
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolutionType: ResolutionType,
    deductAmount: number | undefined,
    resolutionNote: string | undefined,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${disputeId}::uuid FOR UPDATE`;
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { rental_order: true },
      });
      if (!dispute) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Dispute not found',
        });
      }
      if (dispute.status === DisputeStatusType.resolved) {
        return this.toApiDispute(dispute);
      }
      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new BadRequestException({
          error: 'INVALID_DISPUTE_STATUS',
          message: `Dispute status is ${dispute.status}, expected open or under_review`,
        });
      }

      const orderId = dispute.rental_order_id;
      if (dispute.rental_order.status !== OrderStatusType.disputed) {
        throw new BadRequestException({
          error: 'INVALID_ORDER_STATUS',
          message: `Rental order status is ${dispute.rental_order.status}, expected disputed`,
        });
      }

      if (resolutionType === ResolutionType.deposit_deduct) {
        if (deductAmount === undefined) {
          throw new BadRequestException({
            error: 'INVALID_DEDUCT_AMOUNT',
            message:
              'deductAmount must be a positive integer for deposit_deduct',
          });
        }
        await this.escrowService.compensate(orderId, deductAmount, tx);
      } else {
        await this.escrowService.release(orderId, tx);
      }

      await tx.rentalOrder.update({
        where: { id: orderId },
        data: { status: OrderStatusType.completed },
      });

      const resolved = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatusType.resolved,
          resolved_by: adminId,
          resolution_type: resolutionType,
          deduct_amount:
            resolutionType === ResolutionType.deposit_deduct
              ? deductAmount
              : null,
          resolution_note: resolutionNote ?? null,
          resolved_at: new Date(),
        },
      });
      return this.toApiDispute(resolved);
    });
  }

  private toApiDispute(dispute: {
    id: string;
    rental_order_id: string;
    reported_by: string;
    reporter_role: string;
    reason: string;
    description: string | null;
    status: string;
    resolved_by: string | null;
    resolution_note: string | null;
    resolution_type: string | null;
    deduct_amount: Prisma.Decimal | null;
    created_at: Date;
    resolved_at: Date | null;
  }) {
    return {
      id: dispute.id,
      rentalOrderId: dispute.rental_order_id,
      reportedBy: dispute.reported_by,
      reporterRole: dispute.reporter_role,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      resolvedBy: dispute.resolved_by,
      resolutionNote: dispute.resolution_note,
      resolutionType: dispute.resolution_type,
      deductAmount: dispute.deduct_amount?.toNumber() ?? null,
      createdAt: dispute.created_at,
      resolvedAt: dispute.resolved_at,
    };
  }

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: kycUserSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async requireGear(id: string) {
    const gear = await this.prisma.gear.findUnique({ where: { id } });
    if (!gear) throw new NotFoundException('Gear not found');
    return gear;
  }

  private invalidKycTransition(current: string, target: string): never {
    throw new ConflictException({
      error: 'INVALID_KYC_STATUS',
      message: `Cannot change KYC status from ${current} to ${target} without resubmission`,
    });
  }

  private invalidGearTransition(current: string, target: string): never {
    throw new ConflictException({
      error: 'INVALID_GEAR_APPROVAL_STATUS',
      message: `Cannot change gear approval status from ${current} to ${target} without resubmission`,
    });
  }
}
