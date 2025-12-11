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
      include: { roles: true },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: { roles: true },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const saved = await this.prisma.user.upsert({
      where: { id: user.id || 'non-existent-id' }, // Use upsert logic for saving
      update: {
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
      create: {
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        // Initial role creation logic should be here or in a service
        roles: {
          create: {
            roleType: 'CUSTOMER', // Default role
          },
        },
      },
      include: { roles: true },
    });

    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaUser & { roles: any[] }): UserEntity {
    return new UserEntity({
      id: raw.id,
      phoneNumber: raw.phoneNumber,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      roles: raw.roles,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
    });
  }
}
