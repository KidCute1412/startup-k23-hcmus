/* eslint-disable @typescript-eslint/unbound-method */
import { KycStatusType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MediaService } from '../media/media.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const repository = {
    findProfileById: jest.fn(),
    findByEmail: jest.fn(),
    findForAccountClosure: jest.fn(),
    updateProfile: jest.fn(),
    listAddresses: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    setDefaultAddress: jest.fn(),
    getAccountClosureBlockers: jest.fn(),
    closeAccount: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;
  const media = {
    assertOwnedImageFile: jest.fn(),
  } as unknown as jest.Mocked<MediaService>;
  const service = new UsersService(repository, media);

  const safeUser = {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'renter@example.com',
    phone: '0902000006',
    full_name: 'Renter Demo',
    dob: new Date('1999-05-15T00:00:00.000Z'),
    cccd: null,
    avatar_url: null,
    bio: null,
    rating: 4.7,
    total_reviews: 3,
    role: UserRole.renter,
    kyc_status: KycStatusType.pending,
    kyc_rejection_reason: null,
    kyc_front_card_url: null,
    kyc_back_card_url: null,
    kyc_portrait_url: null,
    credit_consent_accepted_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the current user to camelCase without authentication secrets', async () => {
    repository.findProfileById.mockResolvedValue(safeUser);

    const result = await service.findOne(safeUser.id);

    expect(result).toMatchObject({
      id: safeUser.id,
      fullName: 'Renter Demo',
      dob: '1999-05-15',
      kycStatus: 'unverified',
    });
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('hashedRefreshToken');
    expect(result).not.toHaveProperty('full_name');
  });

  it('preserves verified status for legacy verified profiles without stored KYC images', async () => {
    repository.findProfileById.mockResolvedValue({
      ...safeUser,
      kyc_status: KycStatusType.verified,
    });

    await expect(service.findOne(safeUser.id)).resolves.toMatchObject({
      kycStatus: KycStatusType.verified,
    });
  });

  it('validates avatar ownership before updating the profile', async () => {
    const avatarUrl = `/uploads/${safeUser.id}/avatar.jpg`;
    media.assertOwnedImageFile.mockResolvedValue(avatarUrl);
    repository.updateProfile.mockResolvedValue({
      ...safeUser,
      avatar_url: avatarUrl,
    });

    await expect(
      service.updateProfile(safeUser.id, { avatarUrl }),
    ).resolves.toMatchObject({ avatarUrl });
    expect(media.assertOwnedImageFile).toHaveBeenCalledWith(
      safeUser.id,
      avatarUrl,
    );
  });

  it('submits owned KYC images and moves an unverified user to pending', async () => {
    repository.findProfileById.mockResolvedValue(safeUser);
    media.assertOwnedImageFile.mockImplementation((_userId, url) =>
      Promise.resolve(url),
    );
    repository.updateProfile.mockImplementation((_id, data) =>
      Promise.resolve({
        ...safeUser,
        cccd: data.cccd as string,
        kyc_front_card_url: data.kyc_front_card_url as string,
        kyc_back_card_url: data.kyc_back_card_url as string,
        kyc_portrait_url: data.kyc_portrait_url as string,
      }),
    );
    const prefix = `/uploads/${safeUser.id}`;

    await expect(
      service.submitKyc(safeUser.id, {
        cccd: '012345678912',
        frontCardUrl: `${prefix}/front.jpg`,
        backCardUrl: `${prefix}/back.jpg`,
        portraitUrl: `${prefix}/portrait.jpg`,
        creditConsentAccepted: true,
      }),
    ).resolves.toMatchObject({ kycStatus: KycStatusType.pending });
    expect(media.assertOwnedImageFile).toHaveBeenCalledTimes(3);
  });

  it('rejects duplicate pending KYC submissions', async () => {
    repository.findProfileById.mockResolvedValue({
      ...safeUser,
      cccd: '012345678912',
      kyc_front_card_url: '/uploads/user/front.jpg',
      kyc_back_card_url: '/uploads/user/back.jpg',
      kyc_portrait_url: '/uploads/user/portrait.jpg',
    });

    await expect(
      service.submitKyc(safeUser.id, {
        cccd: '012345678912',
        frontCardUrl: '/uploads/user/front.jpg',
        backCardUrl: '/uploads/user/back.jpg',
        portraitUrl: '/uploads/user/portrait.jpg',
        creditConsentAccepted: true,
      }),
    ).rejects.toMatchObject({
      status: 409,
      response: { error: 'KYC_ALREADY_PENDING' },
    });
  });

  it('blocks account closure while obligations are active', async () => {
    const password = 'CurrentPassword123';
    repository.findForAccountClosure.mockResolvedValue({
      id: safeUser.id,
      is_active: true,
      password_hash: await bcrypt.hash(password, 4),
    });
    repository.getAccountClosureBlockers.mockResolvedValue({
      activeOrders: 1,
      openDisputes: 0,
      lockedCash: false,
      lockedCredit: false,
      outstandingDebt: false,
      pendingWithdrawals: 0,
    });

    await expect(
      service.closeAccount(safeUser.id, { password }),
    ).rejects.toMatchObject({
      status: 409,
      response: { error: 'ACCOUNT_HAS_ACTIVE_OBLIGATIONS' },
    });
    expect(repository.closeAccount).not.toHaveBeenCalled();
  });

  it('soft-closes an account with the correct password and no blockers', async () => {
    const password = 'CurrentPassword123';
    repository.findForAccountClosure.mockResolvedValue({
      id: safeUser.id,
      is_active: true,
      password_hash: await bcrypt.hash(password, 4),
    });
    repository.getAccountClosureBlockers.mockResolvedValue({
      activeOrders: 0,
      openDisputes: 0,
      lockedCash: false,
      lockedCredit: false,
      outstandingDebt: false,
      pendingWithdrawals: 0,
    });
    repository.closeAccount.mockResolvedValue({
      id: safeUser.id,
      is_active: false,
    });

    await expect(
      service.closeAccount(safeUser.id, { password }),
    ).resolves.toEqual({ closed: true });
    expect(repository.closeAccount).toHaveBeenCalledWith(safeUser.id);
  });
});
