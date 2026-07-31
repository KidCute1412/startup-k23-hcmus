/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApprovalStatusType, KycStatusType, UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';

describe('AdminService', () => {
  const userModel = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const gearModel = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const mutuxWalletModel = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const creditTransactionModel = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const notificationModel = { create: jest.fn() };
  const escrowService = {
    release: jest.fn(),
    compensate: jest.fn(),
  } as unknown as EscrowService;
  const prisma = {
    user: userModel,
    gear: gearModel,
    mutuxWallet: mutuxWalletModel,
    creditTransaction: creditTransactionModel,
    notification: notificationModel,
    $queryRaw: jest.fn(),
    $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
      Promise.resolve(callback(prisma)),
    ),
  } as unknown as PrismaService;
  let service: AdminService;

  const pendingUser = {
    id: 'user-id',
    email: 'user@example.com',
    full_name: 'User',
    cccd: '012345678912',
    role: UserRole.renter,
    kyc_status: KycStatusType.pending,
    kyc_rejection_reason: null,
    kyc_reviewed_by: null,
    kyc_reviewed_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    credit_consent_accepted_at: new Date('2026-01-01T00:00:00.000Z'),
  };
  const pendingGear = {
    id: 'gear-id',
    lender_id: 'lender-id',
    category_id: null,
    name: 'Gear',
    brand: null,
    model: null,
    serial_number: null,
    description: null,
    specifications: null,
    value: null,
    rent_price_per_day: 100000,
    status: 'available',
    approval_status: ApprovalStatusType.pending,
    approved_by: null,
    approved_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mutuxWalletModel.findUnique.mockResolvedValue({
      id: 'wallet-id',
      total_limit: { equals: (value: number) => value === 3000000 },
      display_balance: 3000000,
      locked_balance: { equals: () => true },
      outstanding_debt: { equals: () => true },
      approved_at: new Date(),
    });
    creditTransactionModel.findFirst.mockResolvedValue({ id: 'grant-id' });
    notificationModel.create.mockResolvedValue({ id: 'notification-id' });
    service = new AdminService(prisma, escrowService);
  });

  it('filters and paginates the KYC queue', async () => {
    userModel.findMany.mockResolvedValue([pendingUser]);
    userModel.count.mockResolvedValue(11);

    await expect(
      service.getKycQueue({
        status: KycStatusType.pending,
        page: 2,
        limit: 5,
      }),
    ).resolves.toEqual({
      data: [pendingUser],
      meta: { total: 11, page: 2, limit: 5, totalPages: 3 },
    });
    expect(userModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kyc_status: KycStatusType.pending },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('filters and paginates the gear approval queue', async () => {
    gearModel.findMany.mockResolvedValue([pendingGear]);
    gearModel.count.mockResolvedValue(4);

    await expect(
      service.getGearQueue({
        approvalStatus: ApprovalStatusType.pending,
        page: 1,
        limit: 3,
      }),
    ).resolves.toEqual({
      data: [pendingGear],
      meta: { total: 4, page: 1, limit: 3, totalPages: 2 },
    });
    expect(gearModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { approval_status: ApprovalStatusType.pending },
        skip: 0,
        take: 3,
      }),
    );
  });

  it('approves KYC and records audit metadata', async () => {
    const verifiedUser = {
      ...pendingUser,
      kyc_status: KycStatusType.verified,
      kyc_reviewed_by: 'admin-id',
      kyc_reviewed_at: new Date(),
    };
    userModel.findUnique
      .mockResolvedValueOnce(pendingUser)
      .mockResolvedValueOnce(verifiedUser);
    userModel.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.approveKyc(pendingUser.id, 'admin-id')).resolves.toBe(
      verifiedUser,
    );
    expect(userModel.updateMany).toHaveBeenCalledWith({
      where: {
        id: pendingUser.id,
        kyc_status: KycStatusType.pending,
      },
      data: expect.objectContaining({
        kyc_status: KycStatusType.verified,
        kyc_rejection_reason: null,
        kyc_reviewed_by: 'admin-id',
        kyc_reviewed_at: expect.any(Date),
      }),
    });
  });

  it('returns an already verified KYC profile without rewriting audit data', async () => {
    const verifiedAt = new Date('2026-07-27T00:00:00.000Z');
    const verifiedUser = {
      ...pendingUser,
      kyc_status: KycStatusType.verified,
      kyc_reviewed_by: 'first-admin',
      kyc_reviewed_at: verifiedAt,
    };
    userModel.findUnique.mockResolvedValue(verifiedUser);

    await expect(
      service.approveKyc(pendingUser.id, 'second-admin'),
    ).resolves.toMatchObject({
      kyc_reviewed_by: 'first-admin',
      kyc_reviewed_at: verifiedAt,
    });
    expect(userModel.updateMany).not.toHaveBeenCalled();
  });

  it('rejects KYC with a reason and is idempotent afterwards', async () => {
    const rejectedUser = {
      ...pendingUser,
      kyc_status: KycStatusType.rejected,
      kyc_rejection_reason: 'Unreadable',
      kyc_reviewed_by: 'admin-id',
      kyc_reviewed_at: new Date(),
    };
    userModel.findUnique
      .mockResolvedValueOnce(pendingUser)
      .mockResolvedValueOnce(rejectedUser)
      .mockResolvedValueOnce(rejectedUser);
    userModel.updateMany.mockResolvedValue({ count: 1 });

    await service.rejectKyc(pendingUser.id, 'admin-id', 'Unreadable');
    await expect(
      service.rejectKyc(pendingUser.id, 'another-admin', 'Changed'),
    ).resolves.toBe(rejectedUser);
    expect(userModel.updateMany).toHaveBeenCalledTimes(1);
  });

  it('approves gear once and preserves approved_at on repeat', async () => {
    const approvedAt = new Date('2026-07-27T00:00:00.000Z');
    const approvedGear = {
      ...pendingGear,
      approval_status: ApprovalStatusType.approved,
      approved_by: 'admin-id',
      approved_at: approvedAt,
    };
    gearModel.findUnique
      .mockResolvedValueOnce(pendingGear)
      .mockResolvedValueOnce(approvedGear)
      .mockResolvedValueOnce(approvedGear);
    gearModel.updateMany.mockResolvedValue({ count: 1 });

    await service.approveGear(pendingGear.id, 'admin-id');
    await expect(
      service.approveGear(pendingGear.id, 'another-admin'),
    ).resolves.toMatchObject({ approved_at: approvedAt });
    expect(gearModel.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects an approved gear and records the admin', async () => {
    const approvedGear = {
      ...pendingGear,
      approval_status: ApprovalStatusType.approved,
    };
    const rejectedGear = {
      ...approvedGear,
      approval_status: ApprovalStatusType.rejected,
      approved_by: 'admin-id',
      approved_at: new Date(),
    };
    gearModel.findUnique
      .mockResolvedValueOnce(approvedGear)
      .mockResolvedValueOnce(rejectedGear);
    gearModel.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.rejectGear(pendingGear.id, 'admin-id')).resolves.toBe(
      rejectedGear,
    );
    expect(gearModel.updateMany).toHaveBeenCalledWith({
      where: {
        id: pendingGear.id,
        approval_status: {
          in: [ApprovalStatusType.pending, ApprovalStatusType.approved],
        },
      },
      data: expect.objectContaining({
        approval_status: ApprovalStatusType.rejected,
        approved_by: 'admin-id',
        approved_at: expect.any(Date),
      }),
    });
  });

  it('returns an already rejected gear without rewriting audit data', async () => {
    const rejectedAt = new Date('2026-07-27T00:00:00.000Z');
    const rejectedGear = {
      ...pendingGear,
      approval_status: ApprovalStatusType.rejected,
      approved_by: 'first-admin',
      approved_at: rejectedAt,
    };
    gearModel.findUnique.mockResolvedValue(rejectedGear);

    await expect(
      service.rejectGear(pendingGear.id, 'second-admin'),
    ).resolves.toMatchObject({
      approved_by: 'first-admin',
      approved_at: rejectedAt,
    });
    expect(gearModel.updateMany).not.toHaveBeenCalled();
  });

  it('returns not found and rejects invalid approval transitions', async () => {
    gearModel.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.approveGear('missing-gear', 'admin-id'),
    ).rejects.toMatchObject({ status: 404 });

    gearModel.findUnique.mockResolvedValueOnce({
      ...pendingGear,
      approval_status: ApprovalStatusType.rejected,
    });
    await expect(
      service.approveGear(pendingGear.id, 'admin-id'),
    ).rejects.toMatchObject({
      status: 409,
      response: { error: 'INVALID_GEAR_APPROVAL_STATUS' },
    });
  });
});
