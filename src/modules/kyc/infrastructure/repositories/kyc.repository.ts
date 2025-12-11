import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { KycEntity } from '../../domain/entities/kyc.entity';

@Injectable()
export class KycRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<KycEntity | null> {
    // This is a placeholder. The KYC model is not in the schema.
    return null;
  }

  async findByUserId(userId: string): Promise<KycEntity | null> {
    // This is a placeholder. The KYC model is not in the schema.
    return null;
  }

  async save(kyc: KycEntity): Promise<KycEntity> {
    // This is a placeholder. The KYC model is not in the schema.
    return kyc;
  }
}
