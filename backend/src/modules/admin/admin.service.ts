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
  LenderUpgradeStatus,
  DisputeStatusType,
  OrderStatusType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetGearQueueQueryDto } from './dto/get-gear-queue-query.dto';
import {
  GetKycQueueQueryDto,
  KycQueueStatus,
} from './dto/get-kyc-queue-query.dto';
import {
  DisputeQueueSortBy,
  GetDisputeQueueQueryDto,
  SortOrder,
} from './dto/get-dispute-queue-query.dto';
import { GetLenderUpgradeRequestsQueryDto } from './dto/get-lender-upgrade-requests-query.dto';
import { EscrowService } from '../escrow/escrow.service';
import { PlatformFinanceService } from '../finance/platform-finance.service';
import type { EscrowResult } from '../escrow/escrow.service.interface';
import { ResolutionType } from './dto/resolve-dispute.dto';
import {
  DashboardAnalyticsGranularity,
  GetDashboardAnalyticsQueryDto,
} from './dto/get-dashboard-analytics-query.dto';
import {
  GetRentalSettlementsQueryDto,
  GetRevenueTransactionsQueryDto,
  GetLenderPayableTransactionsQueryDto,
  GetEscrowHistoryQueryDto,
} from './dto/get-platform-finance-history.dto';

const kycUserSelect = {
  id: true,
  email: true,
  full_name: true,
  cccd: true,
  kyc_front_card_url: true,
  kyc_back_card_url: true,
  kyc_portrait_url: true,
  role: true,
  kyc_status: true,
  kyc_rejection_reason: true,
  kyc_reviewed_by: true,
  kyc_reviewed_at: true,
  created_at: true,
  updated_at: true,
  credit_consent_accepted_at: true,
  lender_enabled: true,
  lender_enabled_at: true,
} satisfies Prisma.UserSelect;

interface DisputeEvidencePayload {
  id: string;
  uploaded_by: string;
  media_type: string;
  url: string;
  uploaded_at: Date;
}

interface DisputeRentalUserPayload {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
}

interface DisputeMediaPayload {
  url: string;
}

interface DisputeGearPayload {
  id: string;
  name: string;
  media?: DisputeMediaPayload[];
}

interface DisputeRentalOrderPayload {
  id: string;
  order_code: string;
  status: OrderStatusType;
  deposit_amount: Prisma.Decimal | number;
  rental_fee?: Prisma.Decimal | number;
  renter?: DisputeRentalUserPayload | null;
  lender?: DisputeRentalUserPayload | null;
  gear?: DisputeGearPayload | null;
}

interface DisputePayload {
  id: string;
  rental_order_id: string;
  reported_by: string;
  reporter_role: string;
  reason: string;
  description?: string | null;
  response_description?: string | null;
  status: DisputeStatusType;
  resolved_by?: string | null;
  resolution_note?: string | null;
  resolution_type?: string | null;
  deduct_amount?: Prisma.Decimal | number | null;
  created_at: Date;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  resolved_at?: Date | null;
  closed_by?: string | null;
  closed_at?: Date | null;
  close_note?: string | null;
  transitions?: Array<{
    id: string;
    from_status: DisputeStatusType | null;
    to_status: DisputeStatusType;
    actor_id: string;
    note: string | null;
    created_at: Date;
  }>;
  evidences?: DisputeEvidencePayload[];
  rental_order?: DisputeRentalOrderPayload | null;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
    private readonly platformFinance: PlatformFinanceService,
  ) {}

  async getKycQueue(query: GetKycQueueQueryDto) {
    const { status, page, limit } = query;
    const where: Prisma.UserWhereInput =
      status === KycQueueStatus.none
        ? {
            kyc_status: KycStatusType.pending,
            OR: [
              { cccd: null },
              { kyc_front_card_url: null },
              { kyc_back_card_url: null },
              { kyc_portrait_url: null },
            ],
          }
        : {
            kyc_status: status,
            ...(status === KycQueueStatus.pending
              ? {
                  cccd: { not: null },
                  kyc_front_card_url: { not: null },
                  kyc_back_card_url: { not: null },
                  kyc_portrait_url: { not: null },
                }
              : {}),
          };
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
        include: {
          lender: {
            select: {
              id: true,
              email: true,
              full_name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          media: {
            select: {
              id: true,
              url: true,
              is_primary: true,
            },
          },
        },
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

  async getDisputeQueue(query: GetDisputeQueueQueryDto) {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = DisputeQueueSortBy.createdAt,
      sortOrder = SortOrder.desc,
    } = query;
    const where: Prisma.DisputeWhereInput = status ? { status } : {};
    const orderBy =
      sortBy === DisputeQueueSortBy.status
        ? [
            { status: sortOrder },
            { created_at: 'desc' as const },
            { id: 'asc' as const },
          ]
        : [{ created_at: sortOrder }, { id: 'asc' as const }];

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          evidences: true,
          rental_order: {
            include: {
              renter: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                  phone: true,
                },
              },
              lender: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  avatar_url: true,
                  phone: true,
                },
              },
              gear: {
                select: {
                  id: true,
                  name: true,
                  media: {
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
          transitions: {
            orderBy: { created_at: 'asc' },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((dispute) => this.toApiDispute(dispute)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLenderUpgradeRequests(query: GetLenderUpgradeRequestsQueryDto) {
    const { status, page = 1, limit = 10 } = query;
    const where: Prisma.LenderUpgradeRequestWhereInput = status
      ? { status }
      : {};
    const [requests, total] = await Promise.all([
      this.prisma.lenderUpgradeRequest.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              email: true,
              full_name: true,
              kyc_status: true,
              lender_enabled: true,
              lender_enabled_at: true,
            },
          },
          reviewer: {
            select: { id: true, email: true, full_name: true },
          },
        },
        orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lenderUpgradeRequest.count({ where }),
    ]);
    return {
      data: requests.map((request) => this.toApiLenderUpgradeRequest(request)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approveLenderUpgradeRequest(requestId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM lender_upgrade_requests WHERE id = ${requestId}::uuid FOR UPDATE`;
      const request = await tx.lenderUpgradeRequest.findUnique({
        where: { id: requestId },
        include: { applicant: true, reviewer: true },
      });
      if (!request)
        throw new NotFoundException('Lender upgrade request not found');
      if (request.status === LenderUpgradeStatus.approved) {
        return this.toApiLenderUpgradeRequest(request);
      }
      if (request.status !== LenderUpgradeStatus.pending) {
        throw new ConflictException({
          error: 'INVALID_LENDER_UPGRADE_STATUS',
          message: `Cannot approve lender upgrade request with status ${request.status}`,
        });
      }
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${request.user_id}::uuid FOR UPDATE`;
      const now = new Date();
      await tx.user.update({
        where: { id: request.user_id },
        data: {
          lender_enabled: true,
          lender_enabled_at: now,
        },
      });
      await tx.lenderWallet.upsert({
        where: { lender_id: request.user_id },
        create: { lender_id: request.user_id },
        update: {},
      });
      const updated = await tx.lenderUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: LenderUpgradeStatus.approved,
          reviewed_by: adminId,
          reviewed_at: now,
        },
        include: { applicant: true, reviewer: true },
      });
      return this.toApiLenderUpgradeRequest(updated);
    });
  }

  async rejectLenderUpgradeRequest(
    requestId: string,
    adminId: string,
    reviewNote: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM lender_upgrade_requests WHERE id = ${requestId}::uuid FOR UPDATE`;
      const request = await tx.lenderUpgradeRequest.findUnique({
        where: { id: requestId },
        include: { applicant: true, reviewer: true },
      });
      if (!request)
        throw new NotFoundException('Lender upgrade request not found');
      if (request.status === LenderUpgradeStatus.rejected) {
        return this.toApiLenderUpgradeRequest(request);
      }
      if (request.status !== LenderUpgradeStatus.pending) {
        throw new ConflictException({
          error: 'INVALID_LENDER_UPGRADE_STATUS',
          message: `Cannot reject lender upgrade request with status ${request.status}`,
        });
      }
      const updated = await tx.lenderUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: LenderUpgradeStatus.rejected,
          review_note: reviewNote.trim(),
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
        include: { applicant: true, reviewer: true },
      });
      return this.toApiLenderUpgradeRequest(updated);
    });
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
      if (dispute.status !== DisputeStatusType.under_review) {
        throw new BadRequestException({
          error: 'INVALID_DISPUTE_STATUS',
          message: `Dispute status is ${dispute.status}, expected under_review`,
        });
      }

      const orderId = dispute.rental_order_id;
      if (dispute.rental_order.status !== OrderStatusType.disputed) {
        throw new BadRequestException({
          error: 'INVALID_ORDER_STATUS',
          message: `Rental order status is ${dispute.rental_order.status}, expected disputed`,
        });
      }

      let settlement: EscrowResult;
      if (resolutionType === ResolutionType.renter_compensation) {
        if (deductAmount === undefined) {
          throw new BadRequestException({
            error: 'INVALID_DEDUCT_AMOUNT',
            message:
              'deductAmount must be a positive integer for renter_compensation',
          });
        }
        if (
          new Prisma.Decimal(deductAmount).greaterThan(
            dispute.rental_order.rental_fee,
          )
        ) {
          throw new BadRequestException({
            error: 'COMPENSATION_EXCEEDS_RENTAL_FEE',
            message: 'Renter compensation cannot exceed rental fee',
          });
        }
        settlement = await this.escrowService.compensateRenter(
          orderId,
          deductAmount,
          tx,
        );
      } else if (
        resolutionType === ResolutionType.lender_compensation ||
        resolutionType === ResolutionType.deposit_deduct
      ) {
        if (deductAmount === undefined) {
          throw new BadRequestException({
            error: 'INVALID_DEDUCT_AMOUNT',
            message:
              'deductAmount must be a positive integer for lender_compensation',
          });
        }
        settlement = await this.escrowService.compensate(
          orderId,
          deductAmount,
          tx,
        );
      } else {
        settlement = await this.escrowService.release(orderId, tx);
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
            resolutionType === ResolutionType.renter_compensation ||
            resolutionType === ResolutionType.lender_compensation ||
            resolutionType === ResolutionType.deposit_deduct
              ? deductAmount
              : null,
          resolution_note: resolutionNote ?? null,
          resolved_at: new Date(),
        },
        include: {
          rental_order: true,
        },
      });
      await tx.disputeTransition.create({
        data: {
          dispute_id: disputeId,
          from_status: DisputeStatusType.under_review,
          to_status: DisputeStatusType.resolved,
          actor_id: adminId,
          note: resolutionNote ?? null,
        },
      });
      const rentalRefundAmount = new Prisma.Decimal(
        resolutionType === ResolutionType.renter_compensation
          ? (deductAmount ?? 0)
          : 0,
      );
      const distributableRentalFee =
        dispute.rental_order.rental_fee.sub(rentalRefundAmount);
      // This is the immutable rate captured when the lender confirmed this
      // order; it is never a hard-coded 30/70 split.
      const platformFeeRateBps =
        dispute.rental_order.platform_fee_rate_bps ?? 0;
      const platformRevenue = distributableRentalFee
        .mul(platformFeeRateBps)
        .div(10_000)
        .floor();
      const lenderRentalIncome = distributableRentalFee.sub(platformRevenue);
      const depositDeducted = new Prisma.Decimal(
        resolutionType === ResolutionType.lender_compensation ||
          resolutionType === ResolutionType.deposit_deduct
          ? (deductAmount ?? 0)
          : 0,
      );
      const behavior =
        resolutionType === ResolutionType.renter_compensation
          ? [
              'Hoàn tiền thuê đã chọn về ví renter.',
              'Trả toàn bộ tiền cọc về renter.',
              'Chia phần tiền thuê còn lại theo tỷ lệ snapshot của đơn.',
            ]
          : resolutionType === ResolutionType.lender_compensation ||
              resolutionType === ResolutionType.deposit_deduct
            ? [
                'Khấu trừ phần tiền cọc đã chọn để bồi thường lender.',
                'Trả phần tiền cọc còn lại về renter.',
                'Quyết toán toàn bộ tiền thuê theo tỷ lệ snapshot của đơn.',
              ]
            : [
                'Trả toàn bộ tiền cọc về renter.',
                'Quyết toán toàn bộ tiền thuê theo tỷ lệ snapshot của đơn.',
                'Không phát sinh khoản bồi thường thêm từ tiền cọc hoặc hoàn tiền thuê.',
              ];
      return {
        ...this.toApiDispute(resolved),
        settlement: {
          escrowAction:
            resolutionType === ResolutionType.renter_compensation
              ? 'renter_compensated'
              : resolutionType === ResolutionType.lender_compensation ||
                  resolutionType === ResolutionType.deposit_deduct
                ? 'compensated'
                : 'released',
          depositReturned: settlement.amount - depositDeducted.toNumber(),
          depositDeducted: depositDeducted.toNumber(),
          renterCompensation: rentalRefundAmount.toNumber(),
          lenderCompensation: depositDeducted.toNumber(),
          lenderRentalIncome: lenderRentalIncome.toNumber(),
          platformRevenue: platformRevenue.toNumber(),
          rentalSettlement: {
            grossRentalFee: dispute.rental_order.rental_fee.toNumber(),
            renterRefund: rentalRefundAmount.toNumber(),
            distributableRentalFee: distributableRentalFee.toNumber(),
            platformFeeRateBps,
            platformFeeRatePercent: platformFeeRateBps / 100,
            platformRevenue: platformRevenue.toNumber(),
            lenderIncome: lenderRentalIncome.toNumber(),
          },
          behavior,
          depositSource: settlement.source,
          escrowStatus: settlement.status,
        },
      };
    });
  }

  async getDashboardAnalytics(query: GetDashboardAnalyticsQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    // Date-only filters are inclusive in the UI. Move the upper bound to the
    // next day so records created during the selected `to` date are included.
    if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
      to.setUTCDate(to.getUTCDate() + 1);
    }
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (from >= to) {
      throw new BadRequestException({
        error: 'INVALID_DATE_RANGE',
        message: '`from` must be earlier than `to`',
      });
    }

    const bucket =
      query.granularity === DashboardAnalyticsGranularity.week ? 'week' : 'day';
    const [timeline, ordersByStatus, kyc, gears, disputes, creditLimits] =
      await Promise.all([
        this.prisma.$queryRaw<
          Array<{
            bucket: Date;
            orders: bigint;
            users: bigint;
            gears: bigint;
            revenue: Prisma.Decimal;
          }>
        >`
        SELECT
          periods.bucket,
          (SELECT COUNT(*) FROM rental_orders o WHERE date_trunc(${bucket}::text, o.created_at) = periods.bucket AND o.created_at >= ${from}::timestamptz AND o.created_at < ${to}::timestamptz) AS orders,
          (SELECT COUNT(*) FROM users u WHERE date_trunc(${bucket}::text, u.created_at) = periods.bucket AND u.created_at >= ${from}::timestamptz AND u.created_at < ${to}::timestamptz) AS users,
          (SELECT COUNT(*) FROM gears g WHERE date_trunc(${bucket}::text, g.created_at) = periods.bucket AND g.created_at >= ${from}::timestamptz AND g.created_at < ${to}::timestamptz) AS gears,
          (SELECT COALESCE(SUM(p.amount), 0) FROM platform_ledger_transactions p WHERE p.type = 'platform_revenue' AND date_trunc(${bucket}::text, p.created_at) = periods.bucket AND p.created_at >= ${from}::timestamptz AND p.created_at < ${to}::timestamptz) AS revenue
        FROM (SELECT generate_series(date_trunc(${bucket}::text, ${from}::timestamptz), date_trunc(${bucket}::text, ${to}::timestamptz), ('1 ' || ${bucket}::text)::interval) AS bucket) periods
        ORDER BY periods.bucket
      `,
        this.prisma.rentalOrder.groupBy({
          by: ['status'],
          where: { created_at: { gte: from, lt: to } },
          _count: { _all: true },
        }),
        this.prisma.user.groupBy({
          by: ['kyc_status'],
          where: { created_at: { gte: from, lt: to } },
          _count: { _all: true },
        }),
        this.prisma.gear.groupBy({
          by: ['approval_status'],
          where: { created_at: { gte: from, lt: to } },
          _count: { _all: true },
        }),
        this.prisma.dispute.groupBy({
          by: ['status'],
          where: { created_at: { gte: from, lt: to } },
          _count: { _all: true },
        }),
        this.prisma.creditLimitRequest.groupBy({
          by: ['status'],
          where: { created_at: { gte: from, lt: to } },
          _count: { _all: true },
        }),
      ]);

    const countRows = <T extends string>(
      rows: Array<{ [key: string]: T | { _all: number } }>,
      key: string,
    ) =>
      rows.map((row) => ({
        status: row[key],
        count: Number((row._count as { _all: number })._all),
      }));
    return {
      range: { from, to, granularity: bucket },
      timeline: timeline.map((row) => ({
        date: row.bucket,
        orders: Number(row.orders),
        users: Number(row.users),
        gears: Number(row.gears),
        revenue: Number(row.revenue),
      })),
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      adminQueues: {
        kyc: countRows(kyc as never[], 'kyc_status'),
        gears: countRows(gears as never[], 'approval_status'),
        disputes: countRows(disputes as never[], 'status'),
        creditLimits: countRows(creditLimits as never[], 'status'),
      },
    };
  }

  async getPlatformFinanceConfig() {
    const [config, history] = await Promise.all([
      this.platformFinance.getConfig(),
      this.prisma.platformFeeConfigAudit.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
    ]);
    return {
      platformFeeRateBps: config.platform_fee_rate_bps,
      platformFeeRatePercent: config.platform_fee_rate_bps / 100,
      updatedAt: config.updated_at,
      history,
    };
  }

  updatePlatformFinanceConfig(adminId: string, rateBps: number) {
    return this.platformFinance.updateRate(adminId, rateBps);
  }

  async getPlatformFinanceOverview() {
    const [wallet, heldCount, escrow] = await Promise.all([
      this.prisma.platformWallet.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      }),
      this.prisma.rentalFeeSettlement.count({ where: { status: 'held' } }),
      this.prisma.escrowWallet.aggregate({
        where: { status: 'locked' },
        _sum: { amount: true },
      }),
    ]);
    return {
      rentalHoldBalance: wallet.rental_hold_balance,
      platformRevenueBalance: wallet.revenue_available_balance,
      lenderPayableBalance: wallet.lender_payable_balance,
      heldRentalOrders: heldCount,
      lockedDepositBalance: escrow._sum.amount ?? new Prisma.Decimal(0),
    };
  }

  async getPlatformFinanceTransactions() {
    return this.prisma.platformLedgerTransaction.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: { rental_order: { select: { id: true, order_code: true } } },
    });
  }

  async getRentalSettlementsHistory(query: GetRentalSettlementsQueryDto) {
    const { status, page, limit } = query;
    const where: Prisma.RentalFeeSettlementWhereInput = status
      ? { status }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.rentalFeeSettlement.findMany({
        where,
        orderBy: { held_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rental_order: {
            select: {
              id: true,
              order_code: true,
              renter: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
              lender: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.rentalFeeSettlement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getRevenueTransactionsHistory(query: GetRevenueTransactionsQueryDto) {
    const { page, limit } = query;
    const where: Prisma.PlatformLedgerTransactionWhereInput = {
      type: 'platform_revenue',
    };

    const [data, total] = await Promise.all([
      this.prisma.platformLedgerTransaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rental_order: {
            select: {
              id: true,
              order_code: true,
              renter: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
              lender: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.platformLedgerTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getLenderPayableTransactionsHistory(
    query: GetLenderPayableTransactionsQueryDto,
  ) {
    const { type, page, limit } = query;
    const where: Prisma.PlatformLedgerTransactionWhereInput = {
      type: type ? type : { in: ['lender_payable', 'lender_withdrawal'] },
    };

    const [data, total] = await Promise.all([
      this.prisma.platformLedgerTransaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rental_order: {
            select: {
              id: true,
              order_code: true,
              lender: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.platformLedgerTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getEscrowHistory(query: GetEscrowHistoryQueryDto) {
    const { status, page, limit } = query;
    const where: Prisma.EscrowWalletWhereInput = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.escrowWallet.findMany({
        where,
        orderBy: { locked_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          rental_order: {
            select: {
              id: true,
              order_code: true,
              renter: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
              lender: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.escrowWallet.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async startDisputeReview(disputeId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${disputeId}::uuid FOR UPDATE`;
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute)
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Dispute not found',
        });
      if (dispute.status === DisputeStatusType.under_review)
        return this.toApiDispute(dispute);
      if (dispute.status !== DisputeStatusType.open) {
        throw new BadRequestException({
          error: 'INVALID_DISPUTE_STATUS',
          message: `Dispute status is ${dispute.status}, expected open`,
        });
      }
      const reviewed = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatusType.under_review,
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
      });
      await tx.disputeTransition.create({
        data: {
          dispute_id: disputeId,
          from_status: DisputeStatusType.open,
          to_status: DisputeStatusType.under_review,
          actor_id: adminId,
        },
      });
      return this.toApiDispute(reviewed);
    });
  }

  async closeDispute(disputeId: string, adminId: string, closeNote?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${disputeId}::uuid FOR UPDATE`;
      const dispute = await tx.dispute.findUnique({ where: { id: disputeId } });
      if (!dispute)
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Dispute not found',
        });
      if (dispute.status === DisputeStatusType.closed)
        return this.toApiDispute(dispute);
      if (dispute.status !== DisputeStatusType.resolved) {
        throw new BadRequestException({
          error: 'INVALID_DISPUTE_STATUS',
          message: `Dispute status is ${dispute.status}, expected resolved`,
        });
      }
      const closed = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatusType.closed,
          closed_by: adminId,
          closed_at: new Date(),
          close_note: closeNote ?? null,
        },
      });
      await tx.disputeTransition.create({
        data: {
          dispute_id: disputeId,
          from_status: DisputeStatusType.resolved,
          to_status: DisputeStatusType.closed,
          actor_id: adminId,
          note: closeNote ?? null,
        },
      });
      return this.toApiDispute(closed);
    });
  }

  private toApiDispute(dispute: DisputePayload) {
    return {
      id: dispute.id,
      rentalOrderId: dispute.rental_order_id,
      reportedBy: dispute.reported_by,
      reporterRole: dispute.reporter_role,
      reason: dispute.reason,
      description: dispute.description,
      responseDescription: dispute.response_description,
      status: dispute.status,
      resolvedBy: dispute.resolved_by,
      resolutionNote: dispute.resolution_note,
      resolutionType: dispute.resolution_type,
      deductAmount: dispute.deduct_amount
        ? typeof dispute.deduct_amount === 'number'
          ? dispute.deduct_amount
          : dispute.deduct_amount.toNumber()
        : null,
      createdAt: dispute.created_at,
      reviewedBy: dispute.reviewed_by ?? null,
      reviewedAt: dispute.reviewed_at ?? null,
      resolvedAt: dispute.resolved_at,
      closedBy: dispute.closed_by ?? null,
      closedAt: dispute.closed_at ?? null,
      closeNote: dispute.close_note ?? null,
      availableActions:
        dispute.status === DisputeStatusType.open
          ? ['start_review']
          : dispute.status === DisputeStatusType.under_review
            ? ['resolve']
            : dispute.status === DisputeStatusType.resolved
              ? ['close']
              : [],
      transitions: dispute.transitions?.map((transition) => ({
        id: transition.id,
        fromStatus: transition.from_status,
        toStatus: transition.to_status,
        actorId: transition.actor_id,
        note: transition.note,
        createdAt: transition.created_at,
      })),
      evidences: dispute.evidences
        ? dispute.evidences.map((e: DisputeEvidencePayload) => ({
            id: e.id,
            uploadedBy: e.uploaded_by,
            mediaType: e.media_type,
            url: e.url,
            uploadedAt: e.uploaded_at,
          }))
        : undefined,
      rentalOrder: dispute.rental_order
        ? {
            id: dispute.rental_order.id,
            orderCode: dispute.rental_order.order_code,
            status: dispute.rental_order.status,
            depositAmount: dispute.rental_order.deposit_amount
              ? typeof dispute.rental_order.deposit_amount === 'number'
                ? dispute.rental_order.deposit_amount
                : dispute.rental_order.deposit_amount.toNumber()
              : 0,
            totalRentFee: dispute.rental_order.rental_fee
              ? typeof dispute.rental_order.rental_fee === 'number'
                ? dispute.rental_order.rental_fee
                : typeof dispute.rental_order.rental_fee.toNumber === 'function'
                  ? dispute.rental_order.rental_fee.toNumber()
                  : Number(dispute.rental_order.rental_fee)
              : 0,
            renter: dispute.rental_order.renter
              ? {
                  id: dispute.rental_order.renter.id,
                  fullName: dispute.rental_order.renter.full_name,
                  email: dispute.rental_order.renter.email,
                  avatarUrl: dispute.rental_order.renter.avatar_url,
                  phone: dispute.rental_order.renter.phone,
                }
              : undefined,
            lender: dispute.rental_order.lender
              ? {
                  id: dispute.rental_order.lender.id,
                  fullName: dispute.rental_order.lender.full_name,
                  email: dispute.rental_order.lender.email,
                  avatarUrl: dispute.rental_order.lender.avatar_url,
                  phone: dispute.rental_order.lender.phone,
                }
              : undefined,
            gear: dispute.rental_order.gear
              ? {
                  id: dispute.rental_order.gear.id,
                  name: dispute.rental_order.gear.name,
                  mediaUrls: dispute.rental_order.gear.media
                    ? dispute.rental_order.gear.media.map(
                        (m: DisputeMediaPayload) => m.url,
                      )
                    : [],
                }
              : undefined,
          }
        : undefined,
    };
  }

  private toApiLenderUpgradeRequest(request: {
    id: string;
    user_id: string;
    status: LenderUpgradeStatus;
    reason: string | null;
    review_note: string | null;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    created_at: Date;
    updated_at: Date;
    applicant?: {
      id: string;
      email: string;
      full_name: string | null;
      kyc_status?: string;
      lender_enabled?: boolean;
      lender_enabled_at?: Date | null;
    } | null;
    reviewer?: {
      id: string;
      email: string;
      full_name: string | null;
    } | null;
  }) {
    return {
      id: request.id,
      userId: request.user_id,
      status: request.status,
      reason: request.reason,
      reviewNote: request.review_note,
      reviewedBy: request.reviewed_by,
      reviewedAt: request.reviewed_at,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      applicant: request.applicant
        ? {
            id: request.applicant.id,
            email: request.applicant.email,
            fullName: request.applicant.full_name,
            kycStatus: request.applicant.kyc_status,
            lenderEnabled: request.applicant.lender_enabled,
            lenderEnabledAt: request.applicant.lender_enabled_at,
          }
        : undefined,
      reviewer: request.reviewer
        ? {
            id: request.reviewer.id,
            email: request.reviewer.email,
            fullName: request.reviewer.full_name,
          }
        : undefined,
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
