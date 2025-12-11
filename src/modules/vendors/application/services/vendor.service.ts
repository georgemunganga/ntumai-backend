import { Injectable } from '@nestjs/common';
import { VendorRepository } from '../../infrastructure/repositories/vendor.repository';
import { VendorEntity } from '../../domain/entities/vendor.entity';

@Injectable()
export class VendorService {
  constructor(private readonly vendorRepository: VendorRepository) {}

  async findById(id: string): Promise<VendorEntity | null> {
    return this.vendorRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<VendorEntity | null> {
    return this.vendorRepository.findByUserId(userId);
  }

  async create(data: Partial<VendorEntity>): Promise<VendorEntity> {
    const vendor = new VendorEntity(data);
    return this.vendorRepository.save(vendor);
  }

  async update(id: string, data: Partial<VendorEntity>): Promise<VendorEntity> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    Object.assign(vendor, data);
    return this.vendorRepository.save(vendor);
  }
}
