import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      cccd: user.cccd,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      rating: user.rating,
      address: user.address,
      totalReviews: user.total_reviews,
      role: user.role,
      kycStatus: user.kyc_status,
      kycRejectionReason: user.kyc_rejection_reason,
      kycReviewedBy: user.kyc_reviewed_by,
      kycReviewedAt: user.kyc_reviewed_at,
      creditConsentAcceptedAt: user.credit_consent_accepted_at,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async submitKyc(
    id: string,
    role: string,
    cccd: string,
    creditConsentAccepted?: boolean,
  ) {
    if (role === 'renter' && creditConsentAccepted !== true) {
      throw new BadRequestException({
        error: 'CREDIT_CONSENT_REQUIRED',
        message: 'Renters must accept the credit terms before submitting KYC',
      });
    }
    await this.usersRepository.submitKyc(id, cccd, creditConsentAccepted);
    return this.findOne(id);
  }
}
