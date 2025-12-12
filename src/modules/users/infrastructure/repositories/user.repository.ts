import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const savedUser = await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        phoneNumber: user.phoneNumber,
        email: user.email,
        status: user.status,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
    return this.mapToEntity(savedUser);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const updateData: any = {};
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status !== undefined) updateData.status = data.status;
    updateData.updatedAt = new Date();

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.mapToEntity(updatedUser);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  private mapToEntity(data: any): UserEntity {
    return new UserEntity({
      id: data.id,
      phoneNumber: data.phoneNumber,
      email: data.email,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
