import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  OrderStatusType,
  ProofStageEnum,
  ProofTypeEnum,
  type RentalProof,
} from '@prisma/client';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRentalProofDto } from './dto/create-rental-proof.dto';
import { CreateRentalProofBatchDto } from './dto/create-rental-proof-batch.dto';
import { RentalOrdersRepository } from './rental-orders.repository';

type ProofActor = 'renter' | 'lender';

interface ProofRule {
  actor: ProofActor;
  status: OrderStatusType;
}

const PROOF_RULES: Record<ProofStageEnum, ProofRule> = {
  [ProofStageEnum.pre_shipment]: {
    actor: 'lender',
    status: OrderStatusType.confirmed,
  },
  [ProofStageEnum.post_received]: {
    actor: 'renter',
    status: OrderStatusType.active,
  },
  [ProofStageEnum.pre_return]: {
    actor: 'renter',
    status: OrderStatusType.returning,
  },
  [ProofStageEnum.post_returned]: {
    actor: 'lender',
    status: OrderStatusType.returning,
  },
};

@Injectable()
export class RentalProofsService {
  constructor(
    private readonly rentalOrdersRepository: RentalOrdersRepository,
    private readonly mediaService: MediaService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async create(
    userId: string,
    rentalOrderId: string,
    dto: CreateRentalProofDto,
  ) {
    if (!this.prisma) {
      const order = await this.getParticipantOrder(userId, rentalOrderId);
      const rule = PROOF_RULES[dto.stage];
      const expectedActorId =
        rule.actor === 'lender' ? order.lender_id : order.renter_id;
      if (expectedActorId !== userId || order.status !== rule.status) {
        throw new BadRequestException({
          error: 'INVALID_PROOF_STAGE',
          message: `Stage ${dto.stage} requires the order ${rule.actor} while order status is ${rule.status}`,
        });
      }
      const fileUrl = await this.mediaService.assertOwnedImageFile(
        userId,
        dto.fileUrl,
      );
      const proof = await this.rentalOrdersRepository.createProof({
        rental_order_id: rentalOrderId,
        uploaded_by: userId,
        stage: dto.stage,
        proof_type: ProofTypeEnum.image,
        file_url: fileUrl,
        note: dto.note,
      });
      return this.toApiProof(proof);
    }
    const proofs = await this.createBatch(userId, rentalOrderId, {
      stage: dto.stage,
      fileUrls: [dto.fileUrl],
      note: dto.note,
    });
    return proofs[0];
  }

  async createBatch(
    userId: string,
    rentalOrderId: string,
    dto: CreateRentalProofBatchDto,
  ) {
    if (!this.prisma) {
      throw new InternalServerErrorException('Prisma service is unavailable');
    }
    const initialOrder = await this.getParticipantOrder(userId, rentalOrderId);
    const initialRule = PROOF_RULES[dto.stage];
    const initialExpectedActorId =
      initialRule.actor === 'lender'
        ? initialOrder.lender_id
        : initialOrder.renter_id;
    if (
      initialExpectedActorId !== userId ||
      initialOrder.status !== initialRule.status
    ) {
      throw new BadRequestException({
        error: 'INVALID_PROOF_STAGE',
        message: `Stage ${dto.stage} requires the order ${initialRule.actor} while order status is ${initialRule.status}`,
      });
    }
    const normalizedUrls = await Promise.all(
      dto.fileUrls.map((fileUrl) =>
        this.mediaService.assertOwnedImageFile(userId, fileUrl),
      ),
    );

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_orders WHERE id = ${rentalOrderId}::uuid FOR UPDATE`;
      const order = await tx.rentalOrder.findUnique({
        where: { id: rentalOrderId },
        select: { id: true, renter_id: true, lender_id: true, status: true },
      });
      if (!order) {
        throw new NotFoundException({
          error: 'NOT_FOUND',
          message: 'Rental order not found',
        });
      }
      if (order.renter_id !== userId && order.lender_id !== userId) {
        throw new ForbiddenException({
          error: 'FORBIDDEN',
          message: 'Only rental order participants can upload proofs',
        });
      }

      const rule = PROOF_RULES[dto.stage];
      const expectedActorId =
        rule.actor === 'lender' ? order.lender_id : order.renter_id;
      if (expectedActorId !== userId || order.status !== rule.status) {
        throw new BadRequestException({
          error: 'INVALID_PROOF_STAGE',
          message: `Stage ${dto.stage} requires the order ${rule.actor} while order status is ${rule.status}`,
        });
      }

      const existing = await tx.rentalProof.findFirst({
        where: { rental_order_id: rentalOrderId, stage: dto.stage },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException({
          error: 'PROOF_STAGE_ALREADY_SUBMITTED',
          message: `Proof stage ${dto.stage} has already been submitted`,
        });
      }

      await tx.rentalProof.createMany({
        data: normalizedUrls.map((fileUrl) => ({
          rental_order_id: rentalOrderId,
          uploaded_by: userId,
          stage: dto.stage,
          proof_type: ProofTypeEnum.image,
          file_url: fileUrl,
          note: dto.note,
        })),
      });
      return tx.rentalProof.findMany({
        where: { rental_order_id: rentalOrderId, stage: dto.stage },
        orderBy: [{ uploaded_at: 'asc' }, { id: 'asc' }],
      });
    });

    return created.map((proof) => this.toApiProof(proof));
  }

  async findAll(userId: string, rentalOrderId: string) {
    await this.getParticipantOrder(userId, rentalOrderId);
    const proofs = await this.rentalOrdersRepository.findProofs(rentalOrderId);
    return proofs.map((proof) => this.toApiProof(proof));
  }

  private async getParticipantOrder(userId: string, rentalOrderId: string) {
    const order =
      await this.rentalOrdersRepository.findProofOrderById(rentalOrderId);
    if (!order) {
      throw new NotFoundException({
        error: 'NOT_FOUND',
        message: 'Rental order not found',
      });
    }
    if (order.renter_id !== userId && order.lender_id !== userId) {
      throw new ForbiddenException({
        error: 'FORBIDDEN',
        message: 'Only rental order participants can access proofs',
      });
    }
    return order;
  }

  private toApiProof(proof: RentalProof) {
    return {
      id: proof.id,
      rentalOrderId: proof.rental_order_id,
      uploadedBy: proof.uploaded_by,
      stage: proof.stage,
      proofType: proof.proof_type,
      fileUrl: proof.file_url,
      note: proof.note,
      uploadedAt: proof.uploaded_at,
    };
  }
}
