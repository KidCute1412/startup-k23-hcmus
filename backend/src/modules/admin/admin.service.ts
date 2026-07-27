import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeStatusType,
  OrderStatusType,
  Prisma,
  ResolutionTypeEnum,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';

const kycUserSelect = {
  id: true,
  email: true,
  full_name: true,
  role: true,
  kyc_status: true,
  kyc_rejection_reason: true,
  kyc_reviewed_by: true,
  kyc_reviewed_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  async approveKyc(userId: string, adminId: string) {
    const user = await this.requireUser(userId);
    if (user.kyc_status === 'verified') return user;
    if (user.kyc_status !== 'pending')
      this.invalidKycTransition(user.kyc_status, 'verified');

    return this.prisma.user.update({
      where: { id: userId },
      select: kycUserSelect,
      data: {
        kyc_status: 'verified',
        kyc_rejection_reason: null,
        kyc_reviewed_by: adminId,
        kyc_reviewed_at: new Date(),
      },
    });
  }

  async rejectKyc(userId: string, adminId: string, reason?: string) {
    const user = await this.requireUser(userId);
    if (user.kyc_status === 'rejected') return user;
    if (user.kyc_status !== 'pending')
      this.invalidKycTransition(user.kyc_status, 'rejected');

    return this.prisma.user.update({
      where: { id: userId },
      select: kycUserSelect,
      data: {
        kyc_status: 'rejected',
        kyc_rejection_reason: reason ?? null,
        kyc_reviewed_by: adminId,
        kyc_reviewed_at: new Date(),
      },
    });
  }

  async approveGear(gearId: string, adminId: string) {
    const gear = await this.requireGear(gearId);
    if (gear.approval_status === 'approved') return gear;
    if (gear.approval_status !== 'pending')
      this.invalidGearTransition(gear.approval_status, 'approved');

    return this.prisma.gear.update({
      where: { id: gearId },
      data: {
        approval_status: 'approved',
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
  }

  async rejectGear(gearId: string, adminId: string) {
    const gear = await this.requireGear(gearId);
    if (gear.approval_status === 'rejected') return gear;

    return this.prisma.gear.update({
      where: { id: gearId },
      data: {
        approval_status: 'rejected',
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolutionType: string,
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
      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new BadRequestException({
          error: 'INVALID_DISPUTE_STATUS',
          message: `Dispute status is ${dispute.status}, expected open or under_review`,
        });
      }

      const orderId = dispute.rental_order_id;

      if (resolutionType === 'deposit_deduct') {
        const deduct = deductAmount ?? 0;
        await this.escrowService.compensate(orderId, deduct, tx);
      } else {
        await this.escrowService.release(orderId, tx);
      }

      await tx.rentalOrder.update({
        where: { id: orderId },
        data: { status: OrderStatusType.completed },
      });

      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatusType.resolved,
          resolved_by: adminId,
          resolution_type: resolutionType as ResolutionTypeEnum,
          deduct_amount: deductAmount ?? 0,
          resolution_note: resolutionNote,
          resolved_at: new Date(),
        },
      });
    });
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
