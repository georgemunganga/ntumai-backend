import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { User as PrismaUser } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      // include: { roles: true }, // Removed: roles relation not in new schema
    });

    return user ? this.toDomain(user) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone: phoneNumber },
      // include: { roles: true }, // Removed: roles relation not in new schema
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      // include: { roles: true }, // Removed: roles relation not in new schema
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const saved = await this.prisma.user.upsert({
      where: { id: user.id || 'non-existent-id' }, // Use upsert logic for saving
      update: {
        phone: user.phoneNumber,
        email: user.email,
        firstName: user.firstName ?? 'User',
        lastName: user.lastName ?? 'NtuMai',
        // isActive: user.isActive,
      },
      create: {
        phone: user.phoneNumber,
        email: user.email,
        firstName: user.firstName ?? 'User',
        lastName: user.lastName ?? 'NtuMai',
        // isActive: user.isActive,
        // Initial role creation logic should be here or in a service
        role: 'CUSTOMER',
        password: 'temporary_password', // Required by new schema
        id: user.id || 'temp-id-' + Date.now(), // Required by new schema
        updatedAt: new Date(), // Required by new schema
      },
      // include: { roles: true }, // Removed: roles relation not in new schema
    });

    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaUser): UserEntity {
    return new UserEntity({
      id: raw.id,
      phoneNumber: raw.phone ?? undefined,
      email: raw.email ?? undefined,
      firstName: raw.firstName ?? undefined,
      lastName: raw.lastName ?? undefined,
      // status: raw.status,
      // roles: raw.roles, // Removed: roles relation not in new schema
      // isActive: raw.isActive,
      createdAt: raw.createdAt,
    });
  }
}
