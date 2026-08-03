import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { KycStatusType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MediaService } from '../media/media.service';
import { CloseAccountDto } from './dto/close-account.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestLenderUpgradeDto } from './dto/request-lender-upgrade.dto';
import {
  toAddressResponse,
  toCurrentUserResponse,
  toLenderUpgradeRequestResponse,
} from './user-response';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mediaService: MediaService,
  ) {}

  async findOne(id: string) {
    const user = await this.usersRepository.findProfileById(id);
    if (!user) throw new NotFoundException('User not found');
    return toCurrentUserResponse(user);
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const data: Prisma.UserUncheckedUpdateInput = {};
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.fullName !== undefined) data.full_name = dto.fullName.trim();
    if (dto.bio !== undefined) data.bio = dto.bio.trim() || null;
    if (dto.dob !== undefined) data.dob = this.parseDateOnly(dto.dob);
    if (dto.avatarUrl !== undefined) {
      data.avatar_url = await this.mediaService.assertOwnedImageFile(
        id,
        dto.avatarUrl,
      );
    }

    const user = await this.usersRepository.updateProfile(id, data);
    return toCurrentUserResponse(user);
  }

  async submitKyc(id: string, dto: SubmitKycDto) {
    const current = await this.usersRepository.findProfileById(id);
    if (!current) throw new NotFoundException('User not found');

    if (current.role === 'renter' && dto.creditConsentAccepted !== true) {
      throw new BadRequestException({
        error: 'CREDIT_CONSENT_REQUIRED',
        message: 'Renters must accept the credit terms before submitting KYC',
      });
    }

    const hasSubmission = Boolean(
      current.cccd &&
      current.kyc_front_card_url &&
      current.kyc_back_card_url &&
      current.kyc_portrait_url,
    );
    if (current.kyc_status === KycStatusType.verified) {
      throw new ConflictException({
        error: 'KYC_ALREADY_VERIFIED',
        message: 'Verified KYC information cannot be resubmitted',
      });
    }
    if (current.kyc_status === KycStatusType.pending && hasSubmission) {
      throw new ConflictException({
        error: 'KYC_ALREADY_PENDING',
        message: 'A KYC submission is already pending review',
      });
    }

    const [frontCardUrl, backCardUrl, portraitUrl] = await Promise.all([
      this.mediaService.assertOwnedImageFile(id, dto.frontCardUrl),
      this.mediaService.assertOwnedImageFile(id, dto.backCardUrl),
      this.mediaService.assertOwnedImageFile(id, dto.portraitUrl),
    ]);

    const user = await this.usersRepository.updateProfile(id, {
      cccd: dto.cccd,
      kyc_front_card_url: frontCardUrl,
      kyc_back_card_url: backCardUrl,
      kyc_portrait_url: portraitUrl,
      kyc_status: KycStatusType.pending,
      kyc_rejection_reason: null,
      kyc_reviewed_by: null,
      kyc_reviewed_at: null,
      credit_consent_accepted_at:
        current.role === 'renter' ? new Date() : undefined,
    });
    return toCurrentUserResponse(user);
  }

  async getLenderUpgradeStatus(userId: string) {
    const user = await this.usersRepository.findProfileById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.lender_enabled) {
      return toLenderUpgradeRequestResponse({
        id: null,
        user_id: user.id,
        status: 'approved',
        reason: null,
        review_note: null,
        reviewed_by: null,
        reviewed_at: user.lender_enabled_at,
        created_at: user.lender_enabled_at,
        updated_at: user.lender_enabled_at,
      });
    }
    const request =
      await this.usersRepository.findLatestLenderUpgradeRequest(userId);
    return request ? toLenderUpgradeRequestResponse(request) : null;
  }

  async requestLenderUpgrade(userId: string, dto: RequestLenderUpgradeDto) {
    const user = await this.usersRepository.findProfileById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'renter') {
      throw new ForbiddenException({
        error: 'RENTER_ONLY',
        message: 'Only renter accounts can request lender enablement',
      });
    }
    if (user.lender_enabled) {
      return toLenderUpgradeRequestResponse({
        id: null,
        user_id: user.id,
        status: 'approved',
        reason: null,
        review_note: null,
        reviewed_by: null,
        reviewed_at: user.lender_enabled_at,
        created_at: user.lender_enabled_at,
        updated_at: user.lender_enabled_at,
      });
    }
    if (user.kyc_status !== KycStatusType.verified) {
      throw new ForbiddenException({
        error: 'KYC_NOT_VERIFIED',
        message: 'Verified KYC is required to request lender enablement',
      });
    }
    const pending =
      await this.usersRepository.findPendingLenderUpgradeRequest(userId);
    if (pending) return toLenderUpgradeRequestResponse(pending);
    const request = await this.usersRepository.createLenderUpgradeRequest(
      userId,
      dto.reason,
    );
    return toLenderUpgradeRequestResponse(request);
  }

  async listAddresses(userId: string) {
    return (await this.usersRepository.listAddresses(userId)).map(
      toAddressResponse,
    );
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const address = await this.usersRepository.createAddress(
      userId,
      this.toAddressData(dto),
      dto.isDefault ?? false,
    );
    return toAddressResponse(address);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const data: Prisma.UserAddressUncheckedUpdateInput = {};
    if (dto.receiverName !== undefined)
      data.receiver_name = dto.receiverName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.detailAddress !== undefined)
      data.detail_address = dto.detailAddress.trim();
    if (dto.ward !== undefined) data.ward = dto.ward.trim();
    if (dto.district !== undefined) data.district = dto.district.trim();
    if (dto.province !== undefined) data.province = dto.province.trim();

    const address = await this.usersRepository.updateAddress(
      userId,
      id,
      data,
      dto.isDefault === true,
    );
    if (!address) throw new NotFoundException('Address not found');
    return toAddressResponse(address);
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.usersRepository.deleteAddress(userId, id);
    if (!address) throw new NotFoundException('Address not found');
    return { id: address.id };
  }

  async setDefaultAddress(userId: string, id: string) {
    const address = await this.usersRepository.setDefaultAddress(userId, id);
    if (!address) throw new NotFoundException('Address not found');
    return toAddressResponse(address);
  }

  async closeAccount(userId: string, dto: CloseAccountDto) {
    const user = await this.usersRepository.findForAccountClosure(userId);
    if (
      !user ||
      !user.is_active ||
      !(await bcrypt.compare(dto.password, user.password_hash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const blockers =
      await this.usersRepository.getAccountClosureBlockers(userId);
    const hasBlockers =
      blockers.activeOrders > 0 ||
      blockers.openDisputes > 0 ||
      blockers.lockedCash ||
      blockers.lockedCredit ||
      blockers.outstandingDebt ||
      blockers.pendingWithdrawals > 0;
    if (hasBlockers) {
      throw new ConflictException({
        error: 'ACCOUNT_HAS_ACTIVE_OBLIGATIONS',
        message:
          'Account cannot be closed while orders, disputes, locked funds, debt, or withdrawals are active',
      });
    }

    await this.usersRepository.closeAccount(userId);
    return { closed: true };
  }

  private toAddressData(dto: CreateAddressDto) {
    return {
      receiver_name: dto.receiverName.trim(),
      phone: dto.phone,
      detail_address: dto.detailAddress.trim(),
      ward: dto.ward.trim(),
      district: dto.district.trim(),
      province: dto.province.trim(),
    };
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException({
        error: 'INVALID_DATE',
        message: 'dob must be a valid YYYY-MM-DD date',
      });
    }
    return date;
  }
}
