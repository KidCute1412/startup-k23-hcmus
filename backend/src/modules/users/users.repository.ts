import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
        cccd: true,
        avatar_url: true,
        bio: true,
        rating: true,
        address: true,
        total_reviews: true,
        role: true,
        kyc_status: true,
        kyc_rejection_reason: true,
        kyc_reviewed_by: true,
        kyc_reviewed_at: true,
        credit_consent_accepted_at: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async submitKyc(
    id: string,
    cccd: string,
    creditConsentAccepted: boolean | undefined,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { role: true },
    });
    return this.prisma.user.update({
      where: { id },
      data: {
        cccd,
        kyc_status: 'pending',
        kyc_rejection_reason: null,
        kyc_reviewed_by: null,
        kyc_reviewed_at: null,
        credit_consent_accepted_at:
          user.role === 'renter' && creditConsentAccepted
            ? new Date()
            : undefined,
      },
    });
  }
}
