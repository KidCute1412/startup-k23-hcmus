import {
  BadRequestException,
  ConflictException,
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

const disputeInclude = { evidences: true } as const;

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
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException({
          error: 'DISPUTE_ALREADY_OPEN',
          message: 'An open dispute already exists for this rental order',
        });
      }
      if (
        lockedOrder.status !== OrderStatusType.active &&
        lockedOrder.status !== OrderStatusType.returning
      ) {
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
