import { Injectable } from '@nestjs/common';
import { KycRepository } from '../../infrastructure/repositories/kyc.repository';
import { KycEntity } from '../../domain/entities/kyc.entity';

@Injectable()
export class KycService {
  constructor(private readonly kycRepository: KycRepository) {}

  async findById(id: string): Promise<KycEntity | null> {
    return this.kycRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<KycEntity | null> {
    return this.kycRepository.findByUserId(userId);
  }

  async create(data: Partial<KycEntity>): Promise<KycEntity> {
    const kyc = new KycEntity(data);
    return this.kycRepository.save(kyc);
  }

  async update(id: string, data: Partial<KycEntity>): Promise<KycEntity> {
    const kyc = await this.kycRepository.findById(id);
    if (!kyc) {
      throw new Error('KYC not found');
    }
    Object.assign(kyc, data);
    return this.kycRepository.save(kyc);
  }
}
