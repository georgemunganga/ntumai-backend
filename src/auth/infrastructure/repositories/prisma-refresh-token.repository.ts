import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return token ? this.toDomain(token) : null;
  }

  async findByUserId(userId: string): Promise<RefreshTokenEntity[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    return tokens.map((token) => this.toDomain(token));
  }

  async findByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<RefreshTokenEntity | null> {
    const token = await this.prisma.refreshToken.findFirst({
      where: { userId, deviceId },
    });
    return token ? this.toDomain(token) : null;
  }

  async create(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const created = await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        tokenHash: token.tokenHash,
        userId: token.userId,
        deviceId: token.deviceId,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent,
        expiresAt: token.expiresAt,
        isRevoked: token.isRevoked,
        revokedAt: token.revokedAt,
      },
    });
    return this.toDomain(created);
  }

  async update(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const updated = await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: {
        isRevoked: token.isRevoked,
        revokedAt: token.revokedAt,
      },
    });
    return this.toDomain(updated);
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    return result.count;
  }

  async revokeByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  private toDomain(prismaToken: any): RefreshTokenEntity {
    return new RefreshTokenEntity({
      id: prismaToken.id,
      tokenHash: prismaToken.tokenHash,
      userId: prismaToken.userId,
      deviceId: prismaToken.deviceId,
      ipAddress: prismaToken.ipAddress,
      userAgent: prismaToken.userAgent,
      expiresAt: prismaToken.expiresAt,
      isRevoked: prismaToken.isRevoked,
      revokedAt: prismaToken.revokedAt,
      createdAt: prismaToken.createdAt,
    });
  }
}
