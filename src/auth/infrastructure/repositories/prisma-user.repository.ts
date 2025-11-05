import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
import { Password } from '../../domain/value-objects/password.vo';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return user ? this.toDomain(user) : null;
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    return user ? this.toDomain(user) : null;
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email?.getValue(),
        phone: user.phone?.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password.getValue(),
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(created);
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email?.getValue(),
        phone: user.phone?.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password.getValue(),
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async exists(email?: string, phone?: string): Promise<boolean> {
    const conditions: Array<{ email?: string; phone?: string }> = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    if (conditions.length === 0) return false;

    const count = await this.prisma.user.count({
      where: {
        OR: conditions,
      },
    });
    return count > 0;
  }

  private toDomain(prismaUser: any): UserEntity {
    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email ? new Email(prismaUser.email) : undefined,
      phone: prismaUser.phone ? Phone.fromE164(prismaUser.phone) : undefined,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      password: Password.fromHash(prismaUser.password),
      role: prismaUser.role,
      isEmailVerified: prismaUser.isEmailVerified,
      isPhoneVerified: prismaUser.isPhoneVerified,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}
