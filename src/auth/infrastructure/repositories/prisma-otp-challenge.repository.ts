import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { IOtpChallengeRepository } from '../../domain/repositories/otp-challenge.repository.interface';
import { OtpChallengeEntity } from '../../domain/entities/otp-challenge.entity';

@Injectable()
export class PrismaOtpChallengeRepository implements IOtpChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChallengeId(
    challengeId: string,
  ): Promise<OtpChallengeEntity | null> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { challengeId },
    });
    return challenge ? this.toDomain(challenge) : null;
  }

  async findActiveByIdentifier(
    identifier: string,
  ): Promise<OtpChallengeEntity | null> {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        identifier,
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return challenge ? this.toDomain(challenge) : null;
  }

  async create(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity> {
    const created = await this.prisma.otpChallenge.create({
      data: {
        id: challenge.id,
        challengeId: challenge.challengeId,
        identifier: challenge.identifier,
        identifierType: challenge.identifierType,
        otpCodeHash: challenge.otpCodeHash,
        purpose: challenge.purpose,
        attempts: challenge.attempts,
        maxAttempts: challenge.maxAttempts,
        expiresAt: challenge.expiresAt,
        resendAvailableAt: challenge.resendAvailableAt,
        isVerified: challenge.isVerified,
        verifiedAt: challenge.verifiedAt,
        ipAddress: challenge.ipAddress,
        userAgent: challenge.userAgent,
      },
    });
    return this.toDomain(created);
  }

  async update(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity> {
    const updated = await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: challenge.attempts,
        isVerified: challenge.isVerified,
        verifiedAt: challenge.verifiedAt,
      },
    });
    return this.toDomain(updated);
  }

  async invalidateByIdentifier(identifier: string): Promise<void> {
    await this.prisma.otpChallenge.updateMany({
      where: {
        identifier,
        isVerified: false,
      },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.otpChallenge.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  private toDomain(prismaChallenge: any): OtpChallengeEntity {
    return new OtpChallengeEntity({
      id: prismaChallenge.id,
      challengeId: prismaChallenge.challengeId,
      identifier: prismaChallenge.identifier,
      identifierType: prismaChallenge.identifierType,
      otpCodeHash: prismaChallenge.otpCodeHash,
      purpose: prismaChallenge.purpose,
      attempts: prismaChallenge.attempts,
      maxAttempts: prismaChallenge.maxAttempts,
      expiresAt: prismaChallenge.expiresAt,
      resendAvailableAt: prismaChallenge.resendAvailableAt,
      isVerified: prismaChallenge.isVerified,
      verifiedAt: prismaChallenge.verifiedAt,
      ipAddress: prismaChallenge.ipAddress,
      userAgent: prismaChallenge.userAgent,
      createdAt: prismaChallenge.createdAt,
    });
  }
}
