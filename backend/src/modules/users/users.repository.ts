import { Injectable } from '@nestjs/common';
import {
  DisputeStatusType,
  OrderStatusType,
  Prisma,
  WithdrawalStatusType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const safeUserSelect = {
  id: true,
  email: true,
  phone: true,
  full_name: true,
  dob: true,
  cccd: true,
  avatar_url: true,
  bio: true,
  rating: true,
  total_reviews: true,
  role: true,
  kyc_status: true,
  kyc_rejection_reason: true,
  kyc_front_card_url: true,
  kyc_back_card_url: true,
  kyc_portrait_url: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

interface AddressInput {
  receiver_name: string;
  phone: string;
  detail_address: string;
  ward: string;
  district: string;
  province: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProfileById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, is_active: true },
      select: safeUserSelect,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findForAccountClosure(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password_hash: true,
        is_active: true,
      },
    });
  }

  updateProfile(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }

  listAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
    });
  }

  async createAddress(
    userId: string,
    data: AddressInput,
    requestedDefault: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      const count = await tx.userAddress.count({ where: { user_id: userId } });
      const isDefault = requestedDefault || count === 0;
      if (isDefault) {
        await tx.userAddress.updateMany({
          where: { user_id: userId, is_default: true },
          data: { is_default: false },
        });
      }
      return tx.userAddress.create({
        data: { user_id: userId, ...data, is_default: isDefault },
      });
    });
  }

  findAddress(userId: string, id: string) {
    return this.prisma.userAddress.findFirst({
      where: { id, user_id: userId },
    });
  }

  async updateAddress(
    userId: string,
    id: string,
    data: Prisma.UserAddressUncheckedUpdateInput,
    requestedDefault: boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      const current = await tx.userAddress.findFirst({
        where: { id, user_id: userId },
      });
      if (!current) return null;
      if (requestedDefault) {
        await tx.userAddress.updateMany({
          where: { user_id: userId, is_default: true },
          data: { is_default: false },
        });
      }
      return tx.userAddress.update({
        where: { id },
        data: {
          ...data,
          ...(requestedDefault ? { is_default: true } : {}),
        },
      });
    });
  }

  async deleteAddress(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      const current = await tx.userAddress.findFirst({
        where: { id, user_id: userId },
      });
      if (!current) return null;
      await tx.userAddress.delete({ where: { id } });
      if (current.is_default) {
        const replacement = await tx.userAddress.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: 'asc' },
        });
        if (replacement) {
          await tx.userAddress.update({
            where: { id: replacement.id },
            data: { is_default: true },
          });
        }
      }
      return current;
    });
  }

  async setDefaultAddress(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockUser(tx, userId);
      const current = await tx.userAddress.findFirst({
        where: { id, user_id: userId },
      });
      if (!current) return null;
      await tx.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
      return tx.userAddress.update({
        where: { id },
        data: { is_default: true },
      });
    });
  }

  async getAccountClosureBlockers(userId: string) {
    const [activeOrders, openDisputes, renterWallet, mutuxWallet, withdrawals] =
      await Promise.all([
        this.prisma.rentalOrder.count({
          where: {
            OR: [{ renter_id: userId }, { lender_id: userId }],
            status: {
              notIn: [OrderStatusType.completed, OrderStatusType.cancelled],
            },
          },
        }),
        this.prisma.dispute.count({
          where: {
            reported_by: userId,
            status: {
              in: [DisputeStatusType.open, DisputeStatusType.under_review],
            },
          },
        }),
        this.prisma.renterWallet.findUnique({
          where: { user_id: userId },
          select: { locked_balance: true },
        }),
        this.prisma.mutuxWallet.findUnique({
          where: { user_id: userId },
          select: { locked_balance: true, outstanding_debt: true },
        }),
        this.prisma.withdrawal.count({
          where: {
            lender_wallet: { lender_id: userId },
            status: {
              in: [WithdrawalStatusType.pending, WithdrawalStatusType.approved],
            },
          },
        }),
      ]);

    return {
      activeOrders,
      openDisputes,
      lockedCash: renterWallet?.locked_balance.greaterThan(0) ?? false,
      lockedCredit: mutuxWallet?.locked_balance.greaterThan(0) ?? false,
      outstandingDebt: mutuxWallet?.outstanding_debt.greaterThan(0) ?? false,
      pendingWithdrawals: withdrawals,
    };
  }

  closeAccount(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        is_active: false,
        hashedRefreshToken: null,
      },
      select: { id: true, is_active: true },
    });
  }

  private async lockUser(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
  }
}
