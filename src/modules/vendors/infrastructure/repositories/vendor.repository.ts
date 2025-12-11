import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { VendorEntity } from '../../domain/entities/vendor.entity';
import { Vendor as PrismaVendor } from '@prisma/client';

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<VendorEntity | null> {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    return vendor ? this.toDomain(vendor) : null;
  }

  async findByUserId(userId: string): Promise<VendorEntity | null> {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    return vendor ? this.toDomain(vendor) : null;
  }

  async save(vendor: VendorEntity): Promise<VendorEntity> {
    const saved = await this.prisma.vendor.upsert({
      where: { id: vendor.id || 'non-existent-id' },
      update: { businessName: vendor.businessName, businessType: vendor.businessType, isOpen: vendor.isOpen },
      create: { id: vendor.id, userId: vendor.userId, businessName: vendor.businessName, businessType: vendor.businessType, isOpen: vendor.isOpen },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaVendor): VendorEntity {
    return new VendorEntity(raw);
  }
}
