import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatusType, KycStatusType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetGearQueueQueryDto } from './dto/get-gear-queue-query.dto';
import { GetKycQueueQueryDto } from './dto/get-kyc-queue-query.dto';

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
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
    const user = await this.requireUser(userId);
    if (user.kyc_status === KycStatusType.verified) return user;
    if (user.kyc_status !== KycStatusType.pending) {
      this.invalidKycTransition(user.kyc_status, KycStatusType.verified);
    }

    await this.prisma.user.updateMany({
      where: { id: userId, kyc_status: KycStatusType.pending },
      data: {
        kyc_status: KycStatusType.verified,
        kyc_rejection_reason: null,
        kyc_reviewed_by: adminId,
        kyc_reviewed_at: new Date(),
      },
    });

    const current = await this.requireUser(userId);
    if (current.kyc_status === KycStatusType.verified) return current;
    return this.invalidKycTransition(
      current.kyc_status,
      KycStatusType.verified,
    );
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
