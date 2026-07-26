import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatusType,
  Prisma,
  ProofStageEnum,
  ProofTypeEnum,
  type RentalProof,
} from '@prisma/client';
import { MediaService } from '../media/media.service';
import { CreateRentalProofDto } from './dto/create-rental-proof.dto';
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
  ) {}

  async create(
    userId: string,
    rentalOrderId: string,
    dto: CreateRentalProofDto,
  ) {
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
    const data: Prisma.RentalProofUncheckedCreateInput = {
      rental_order_id: rentalOrderId,
      uploaded_by: userId,
      stage: dto.stage,
      proof_type: ProofTypeEnum.image,
      file_url: fileUrl,
      note: dto.note,
    };
    const proof = await this.rentalOrdersRepository.createProof(data);
    return this.toApiProof(proof);
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
