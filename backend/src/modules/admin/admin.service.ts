import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
