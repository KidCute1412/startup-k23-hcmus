import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeStatusType,
  OrderStatusType,
  ReporterRoleEnum,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { CreateDisputeResponseDto } from './dto/create-dispute-response.dto';

const disputeInclude = { evidences: true } as const;
const DISPUTE_RESPONSE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async create(userId: string, dto: CreateDisputeDto) {
    const order = await this.prisma.rentalOrder.findUnique({
      where: { id: dto.rentalOrderId },
      select: { id: true, renter_id: true, lender_id: true },
    });
    this.assertParticipant(order, userId);

    const existingDispute = await this.prisma.dispute.findFirst({
      where: {
        rental_order_id: dto.rentalOrderId,
        status: {
          in: [DisputeStatusType.open, DisputeStatusType.under_review],
        },
      },
      include: disputeInclude,
    });
    if (existingDispute) return this.toApiDispute(existingDispute);

    const evidenceUrls = await Promise.all(
      dto.evidences.map((evidence) =>
        this.mediaService.assertOwnedImageFile(userId, evidence.url),
      ),
    );

    const dispute = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${dto.rentalOrderId}::uuid FOR UPDATE`;
      const lockedOrder = await tx.rentalOrder.findUnique({
        where: { id: dto.rentalOrderId },
        select: {
          id: true,
          renter_id: true,
          lender_id: true,
          status: true,
        },
      });
      this.assertParticipant(lockedOrder, userId);

      const existing = await tx.dispute.findFirst({
        where: {
          rental_order_id: lockedOrder.id,
          status: {
            in: [DisputeStatusType.open, DisputeStatusType.under_review],
          },
        },
        include: disputeInclude,
      });
      if (existing) return existing;
      const isRenter = lockedOrder.renter_id === userId;
      const allowedStage = isRenter
        ? lockedOrder.status === OrderStatusType.delivering ||
          lockedOrder.status === OrderStatusType.active ||
          lockedOrder.status === OrderStatusType.returning
        : lockedOrder.status === OrderStatusType.returning;
      if (!allowedStage) {
        throw new BadRequestException({
          error: 'DISPUTE_NOT_ALLOWED_AT_THIS_STAGE',
          message: `Disputes are not allowed while order status is ${lockedOrder.status}`,
        });
      }

      const reporterRole =
        lockedOrder.renter_id === userId
          ? ReporterRoleEnum.renter
          : ReporterRoleEnum.lender;
      const created = await tx.dispute.create({
        data: {
          rental_order_id: lockedOrder.id,
          reported_by: userId,
          reporter_role: reporterRole,
          reason: dto.reason,
          description: dto.description,
          evidences: {
            create: evidenceUrls.map((url) => ({
              uploaded_by: userId,
              media_type: 'image',
              url,
            })),
          },
        },
        include: disputeInclude,
      });
      await tx.rentalOrder.update({
        where: { id: lockedOrder.id },
        data: { status: OrderStatusType.disputed },
      });
      return created;
    });

    return this.toApiDispute(dispute);
  }

  async addResponseEvidence(
    userId: string,
    disputeId: string,
    dto: CreateDisputeResponseDto,
  ) {
    const normalizedUrls = await Promise.all(
      dto.evidences.map((evidence) =>
        this.mediaService.assertOwnedImageFile(userId, evidence.url),
      ),
    );

    const dispute = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${disputeId}::uuid FOR UPDATE`;
      const current = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { rental_order: true, evidences: true },
      });
      if (!current) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Dispute not found',
        });
      }
      this.assertParticipant(
        {
          id: current.rental_order.id,
          renter_id: current.rental_order.renter_id,
          lender_id: current.rental_order.lender_id,
        },
        userId,
      );
      if (current.reported_by === userId) {
        throw new ForbiddenException({
          error: 'REPORTER_CANNOT_RESPOND',
          message: 'The dispute reporter cannot submit response evidence',
        });
      }
      if (
        current.status !== DisputeStatusType.open &&
        current.status !== DisputeStatusType.under_review
      ) {
        throw new BadRequestException({
          error: 'DISPUTE_NOT_OPEN',
          message:
            'Response evidence can only be submitted for an open dispute',
        });
      }
      const deadline = new Date(
        current.created_at.getTime() + DISPUTE_RESPONSE_WINDOW_MS,
      );
      if (new Date() > deadline) {
        throw new BadRequestException({
          error: 'RESPONSE_DEADLINE_PASSED',
          message: 'The response evidence deadline has passed',
        });
      }
      const alreadyResponded = current.evidences.some(
        (evidence) => evidence.uploaded_by === userId,
      );
      if (alreadyResponded) {
        throw new BadRequestException({
          error: 'RESPONSE_EVIDENCE_ALREADY_SUBMITTED',
          message: 'Response evidence has already been submitted',
        });
      }

      await tx.disputeEvidence.createMany({
        data: normalizedUrls.map((url) => ({
          dispute_id: disputeId,
          uploaded_by: userId,
          media_type: 'image',
          url,
        })),
      });
      return tx.dispute.findUniqueOrThrow({
        where: { id: disputeId },
        include: disputeInclude,
      });
    });

    return this.toApiDispute(dispute);
  }

  private assertParticipant(
    order: { id: string; renter_id: string; lender_id: string } | null,
    userId: string,
  ): asserts order is {
    id: string;
    renter_id: string;
    lender_id: string;
  } {
    if (!order) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Rental order not found',
      });
    }
    if (order.renter_id !== userId && order.lender_id !== userId) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only rental order participants can create a dispute',
      });
    }
  }

  private toApiDispute(dispute: {
    id: string;
    rental_order_id: string;
    reported_by: string;
    reporter_role: ReporterRoleEnum;
    reason: string;
    description: string | null;
    status: DisputeStatusType;
    resolved_by: string | null;
    resolution_note: string | null;
    resolution_type: string | null;
    deduct_amount: { toNumber(): number } | null;
    created_at: Date;
    resolved_at: Date | null;
    evidences: Array<{
      id: string;
      uploaded_by: string;
      media_type: string;
      url: string;
      uploaded_at: Date;
    }>;
  }) {
    return {
      id: dispute.id,
      rentalOrderId: dispute.rental_order_id,
      reportedBy: dispute.reported_by,
      reporterRole: dispute.reporter_role,
      reason: dispute.reason,
      description: dispute.description,
      status: dispute.status,
      resolvedBy: dispute.resolved_by,
      resolutionNote: dispute.resolution_note,
      resolutionType: dispute.resolution_type,
      deductAmount: dispute.deduct_amount?.toNumber() ?? null,
      createdAt: dispute.created_at,
      resolvedAt: dispute.resolved_at,
      responseDeadlineAt: new Date(
        dispute.created_at.getTime() + DISPUTE_RESPONSE_WINDOW_MS,
      ),
      evidences: dispute.evidences.map((evidence) => ({
        id: evidence.id,
        uploadedBy: evidence.uploaded_by,
        mediaType: evidence.media_type,
        url: evidence.url,
        uploadedAt: evidence.uploaded_at,
      })),
    };
  }
}
