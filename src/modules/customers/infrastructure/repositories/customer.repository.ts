import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { CustomerEntity } from '../../domain/entities/customer.entity';
import { Customer as PrismaCustomer } from '@prisma/client';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { addresses: true },
    });

    return customer ? this.toDomain(customer) : null;
  }

  async findByUserId(userId: string): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: { addresses: true },
    });

    return customer ? this.toDomain(customer) : null;
  }

  async save(customer: CustomerEntity): Promise<CustomerEntity> {
    const saved = await this.prisma.customer.upsert({
      where: { id: customer.id || 'non-existent-id' },
      update: { defaultAddress: customer.defaultAddress, preferences: customer.preferences as any },
      create: { userId: customer.userId, defaultAddress: customer.defaultAddress, preferences: customer.preferences as any },
      include: { addresses: true },
    });

    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaCustomer & { addresses: any[] }): CustomerEntity {
    return new CustomerEntity({
      id: raw.id,
      userId: raw.userId,
      defaultAddress: raw.defaultAddress,
      preferences: raw.preferences,
      addresses: raw.addresses,
    });
  }
}
