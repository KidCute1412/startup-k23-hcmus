import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CreditLimitRequestStatus,
  KycStatusType,
  Prisma,
  WalletStatusType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  completedOrdersRequired,
  isConfiguredCreditTier,
  nextCreditLimitTiers,
} from './credit-limit-policy';
import type { ApproveCreditLimitRequestDto } from './dto/approve-credit-limit-request.dto';
import type { CreateCreditLimitRequestDto } from './dto/create-credit-limit-request.dto';
import type { GetCreditLimitRequestsQueryDto } from './dto/get-credit-limit-requests-query.dto';

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class CreditLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(userId: string, dto: CreateCreditLimitRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const context = await this.requireContext(tx, userId);
      const currentLimit = context.wallet.total_limit.toNumber();
      await this.assertEligible(
        tx,
        userId,
        currentLimit,
        dto.requestedLimit,
        context,
      );
      const acceptedAt = new Date();
      try {
        const request = await tx.creditLimitRequest.create({
          data: {
            user_id: userId,
            requested_limit: dto.requestedLimit,
            current_limit: currentLimit,
            consent_accepted_at: acceptedAt,
            credit_consent_snapshot_at:
              context.user.credit_consent_accepted_at!,
          },
        });
        return this.toApi(request);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException({
            error: 'ACTIVE_REQUEST_EXISTS',
            message: 'An active credit limit request already exists',
          });
        }
        throw error;
      }
    });
  }

  async getMine(userId: string) {
    const requests = await this.prisma.creditLimitRequest.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    const mapped = requests.map((item) => this.toApi(item));
    return {
      active:
        mapped.find(
          (item) =>
            item.status === CreditLimitRequestStatus.pending ||
            item.status === CreditLimitRequestStatus.under_review,
        ) ?? null,
      history: mapped,
    };
  }

  async cancelRequest(userId: string, requestId: string) {
    const updated = await this.prisma.creditLimitRequest.updateMany({
      where: {
        id: requestId,
        user_id: userId,
        status: CreditLimitRequestStatus.pending,
      },
      data: { status: CreditLimitRequestStatus.cancelled },
    });
    if (updated.count === 0) {
      const request = await this.prisma.creditLimitRequest.findUnique({
        where: { id: requestId },
      });
      if (!request || request.user_id !== userId)
        throw new NotFoundException({
          error: 'CREDIT_LIMIT_REQUEST_NOT_FOUND',
          message: 'Credit limit request not found',
        });
      throw new ConflictException({
        error: 'INVALID_REQUEST_STATUS',
        message: 'Only pending requests can be cancelled',
      });
    }
    return this.toApi(
      await this.prisma.creditLimitRequest.findUniqueOrThrow({
        where: { id: requestId },
      }),
    );
  }

  async listRequests(query: GetCreditLimitRequestsQueryDto) {
    const where = query.status ? { status: query.status } : {};
    const [requests, total] = await Promise.all([
      this.prisma.creditLimitRequest.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              email: true,
              full_name: true,
              kyc_status: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.creditLimitRequest.count({ where }),
    ]);
    const data = await Promise.all(
      requests.map(async (request) => ({
        ...this.toApi(request),
        applicant: {
          id: request.applicant.id,
          email: request.applicant.email,
          fullName: request.applicant.full_name,
          kycStatus: request.applicant.kyc_status,
        },
        eligibility: await this.eligibilitySummary(request.user_id),
      })),
    );
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async startReview(requestId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockRequest(tx, requestId);
      const request = await this.requireRequest(tx, requestId);
      if (request.status === CreditLimitRequestStatus.under_review)
        return this.toApi(request);
      if (request.status !== CreditLimitRequestStatus.pending)
        this.invalidStatus(request.status, 'under_review');
      return this.toApi(
        await tx.creditLimitRequest.update({
          where: { id: requestId },
          data: {
            status: CreditLimitRequestStatus.under_review,
            reviewed_by: adminId,
            reviewed_at: new Date(),
          },
        }),
      );
    });
  }

  async approveRequest(
    requestId: string,
    adminId: string,
    dto: ApproveCreditLimitRequestDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockRequest(tx, requestId);
      const request = await this.requireRequest(tx, requestId);
      if (request.status === CreditLimitRequestStatus.approved) {
        if (!request.approved_limit?.equals(dto.approvedLimit)) {
          throw new ConflictException({
            error: 'APPROVAL_RESULT_MISMATCH',
            message: 'Request was approved with a different limit',
          });
        }
        return this.toApi(request);
      }
      if (request.status !== CreditLimitRequestStatus.under_review)
        this.invalidStatus(request.status, 'approved');
      if (!request.requested_limit.equals(dto.approvedLimit)) {
        throw new ConflictException({
          error: 'APPROVED_LIMIT_MUST_MATCH_REQUEST',
          message: 'approvedLimit must equal the requested tier',
        });
      }

      await tx.$queryRaw`SELECT id FROM mutux_wallets WHERE user_id = ${request.user_id}::uuid FOR UPDATE`;
      const context = await this.requireContext(tx, request.user_id);
      const currentLimit = context.wallet.total_limit.toNumber();
      await this.assertEligible(
        tx,
        request.user_id,
        currentLimit,
        dto.approvedLimit,
        context,
      );
      const before = context.wallet.display_balance;
      const increase = new Prisma.Decimal(dto.approvedLimit).minus(
        context.wallet.total_limit,
      );
      const after = before.plus(increase);
      await tx.mutuxWallet.update({
        where: { id: context.wallet.id },
        data: {
          total_limit: dto.approvedLimit,
          display_balance: after,
          approved_at: new Date(),
          expired_at: null,
        },
      });
      await tx.creditTransaction.create({
        data: {
          mutux_wallet_id: context.wallet.id,
          type: 'limit_adjustment',
          amount: increase,
          display_balance_before: before,
          display_balance_after: after,
          direction: 'in',
          ref_type: 'credit_limit_request',
          ref_id: request.id,
          note: dto.reviewNote ?? 'Credit limit increase approved',
          status: 'success',
        },
      });
      return this.toApi(
        await tx.creditLimitRequest.update({
          where: { id: request.id },
          data: {
            status: CreditLimitRequestStatus.approved,
            approved_limit: dto.approvedLimit,
            review_note: dto.reviewNote,
            reviewed_by: adminId,
            reviewed_at: new Date(),
          },
        }),
      );
    });
  }

  async rejectRequest(requestId: string, adminId: string, reviewNote: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockRequest(tx, requestId);
      const request = await this.requireRequest(tx, requestId);
      if (request.status === CreditLimitRequestStatus.rejected)
        return this.toApi(request);
      if (
        request.status !== CreditLimitRequestStatus.pending &&
        request.status !== CreditLimitRequestStatus.under_review
      )
        this.invalidStatus(request.status, 'rejected');
      return this.toApi(
        await tx.creditLimitRequest.update({
          where: { id: request.id },
          data: {
            status: CreditLimitRequestStatus.rejected,
            review_note: reviewNote,
            reviewed_by: adminId,
            reviewed_at: new Date(),
          },
        }),
      );
    });
  }

  async eligibilitySummary(userId: string) {
    const [completedOrders, openDisputes, adverseDisputes] = await Promise.all([
      this.prisma.rentalOrder.count({
        where: { renter_id: userId, status: 'completed' },
      }),
      this.prisma.dispute.count({
        where: {
          rental_order: { renter_id: userId },
          status: { in: ['open', 'under_review'] },
        },
      }),
      this.prisma.dispute.count({
        where: {
          rental_order: { renter_id: userId },
          resolution_type: 'deposit_deduct',
        },
      }),
    ]);
    return { completedOrders, openDisputes, adverseDisputes };
  }

  private async assertEligible(
    db: Db,
    userId: string,
    currentLimit: number,
    requestedLimit: number,
    context: Awaited<ReturnType<CreditLimitsService['requireContext']>>,
  ) {
    if (
      context.user.kyc_status !== KycStatusType.verified ||
      !context.user.credit_consent_accepted_at
    )
      this.ineligible('KYC_OR_CONSENT_REQUIRED');
    if (context.wallet.status !== WalletStatusType.active)
      this.ineligible('WALLET_INACTIVE');
    if (context.wallet.outstanding_debt.greaterThan(0))
      this.ineligible('OUTSTANDING_DEBT');
    if (
      !isConfiguredCreditTier(requestedLimit) ||
      !nextCreditLimitTiers(currentLimit).includes(requestedLimit)
    )
      this.ineligible('INVALID_CREDIT_TIER');

    const [completedOrders, openDisputes, adverseDisputes] = await Promise.all([
      db.rentalOrder.count({
        where: { renter_id: userId, status: 'completed' },
      }),
      db.dispute.count({
        where: {
          rental_order: { renter_id: userId },
          status: { in: ['open', 'under_review'] },
        },
      }),
      db.dispute.count({
        where: {
          rental_order: { renter_id: userId },
          resolution_type: 'deposit_deduct',
        },
      }),
    ]);
    if (completedOrders < completedOrdersRequired(requestedLimit))
      this.ineligible('COMPLETED_ORDERS_REQUIRED');
    if (openDisputes > 0) this.ineligible('OPEN_DISPUTE');
    if (adverseDisputes > 0) this.ineligible('ADVERSE_DISPUTE');
  }

  private async requireContext(db: Db, userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        kyc_status: true,
        credit_consent_accepted_at: true,
        mutux_wallet: true,
      },
    });
    if (!user)
      throw new NotFoundException({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    if (!user.mutux_wallet)
      throw new NotFoundException({
        error: 'CREDIT_WALLET_NOT_FOUND',
        message: 'Mutux credit wallet not found',
      });
    return { user, wallet: user.mutux_wallet };
  }

  private async lockRequest(tx: Prisma.TransactionClient, requestId: string) {
    await tx.$queryRaw`SELECT id FROM credit_limit_requests WHERE id = ${requestId}::uuid FOR UPDATE`;
  }

  private async requireRequest(db: Db, requestId: string) {
    const request = await db.creditLimitRequest.findUnique({
      where: { id: requestId },
    });
    if (!request)
      throw new NotFoundException({
        error: 'CREDIT_LIMIT_REQUEST_NOT_FOUND',
        message: 'Credit limit request not found',
      });
    return request;
  }

  private invalidStatus(current: string, target: string): never {
    throw new ConflictException({
      error: 'INVALID_REQUEST_STATUS',
      message: `Cannot change credit limit request from ${current} to ${target}`,
    });
  }

  private ineligible(code: string): never {
    throw new UnprocessableEntityException({
      error: code,
      message: 'Credit limit policy requirements are not satisfied',
    });
  }

  private toApi(request: {
    id: string;
    user_id: string;
    requested_limit: Prisma.Decimal;
    current_limit: Prisma.Decimal;
    approved_limit: Prisma.Decimal | null;
    consent_accepted_at: Date;
    status: CreditLimitRequestStatus;
    review_note: string | null;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      id: request.id,
      userId: request.user_id,
      requestedLimit: request.requested_limit.toNumber(),
      currentLimit: request.current_limit.toNumber(),
      approvedLimit: request.approved_limit?.toNumber() ?? null,
      consentAcceptedAt: request.consent_accepted_at,
      status: request.status,
      reviewNote: request.review_note,
      reviewedBy: request.reviewed_by,
      reviewedAt: request.reviewed_at,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    };
  }
}
