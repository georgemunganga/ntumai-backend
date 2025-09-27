import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OTPType } from '@prisma/client';
import { Otp, OtpPurpose } from '../../domain/entities/otp.entity';
import {
  OtpRepository,
  FindOtpOptions,
  OtpFilters,
  PaginationOptions,
  PaginatedOtpResult,
} from '../../domain/repositories/otp.repository';

@Injectable()
export class PrismaOtpRepository extends OtpRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private get prismaOtpClient(): any {
    const client = (this.prisma as any).oTPVerification;
    if (!client) {
      throw new Error('Prisma OTP verification model is not configured. Please define the OTPVerification model in the Prisma schema.');
    }
    return client;
  }

  async save(otp: Otp): Promise<Otp> {
    const data = otp.toPersistence();

    const savedData = await this.prismaOtpClient.upsert({
      where: { requestId: data.id },
      update: {
        otp: data.hashedCode,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        isVerified: data.isUsed,
        expiresAt: data.expiresAt,
        verifiedAt: otp.verifiedAt ?? null,
        updatedAt: data.updatedAt,
      },
      create: {
        requestId: data.id,
        phoneNumber: data.identifier,
        countryCode: data.identifier.includes('@') ? 'EMAIL' : 'INTL',
        otp: data.hashedCode,
        type: this.mapPurposeToPrisma(data.purpose),
        isVerified: data.isUsed,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        expiresAt: data.expiresAt,
        verifiedAt: otp.verifiedAt ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.toDomain(savedData);
  }

  async findById(id: string): Promise<Otp | null> {
    const data = await this.prismaOtpClient.findUnique({
      where: { requestId: id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findValidOtp(identifier: string, purpose: OtpPurpose): Promise<Otp | null> {
    const data = await this.prismaOtpClient.findFirst({
      where: {
        phoneNumber: identifier,
        type: this.mapPurposeToPrisma(purpose),
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findOne(options: FindOtpOptions): Promise<Otp | null> {
    const where: any = {};

    if (options.identifier) {
      where.phoneNumber = options.identifier;
    }

    if (options.purpose) {
      where.type = this.mapPurposeToPrisma(options.purpose);
    }

    if (options.isUsed !== undefined) {
      where.isVerified = options.isUsed;
    }

    if (!options.includeExpired) {
      where.expiresAt = {
        gt: new Date(),
      };
    }

    const data = await this.prismaOtpClient.findFirst({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async findMany(filters: OtpFilters): Promise<Otp[]> {
    const where = this.buildWhereClause(filters);

    const data = await this.prismaOtpClient.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data.map(item => this.toDomain(item));
  }

  async findWithPagination(
    filters: OtpFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedOtpResult> {
    const where = this.buildWhereClause(filters);
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prismaOtpClient.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaOtpClient.count({ where }),
    ]);

    const otps = data.map(item => this.toDomain(item));
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: otps,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prismaOtpClient.delete({
      where: { requestId: id },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prismaOtpClient.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prismaOtpClient.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }

  async count(filters: OtpFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prismaOtpClient.count({ where });
  }

  async countForIdentifierInPeriod(
    identifier: string,
    purpose: OtpPurpose,
    periodMinutes: number
  ): Promise<number> {
    const periodStart = new Date(Date.now() - periodMinutes * 60 * 1000);

    return this.prismaOtpClient.count({
      where: {
        phoneNumber: identifier,
        type: this.mapPurposeToPrisma(purpose),
        createdAt: {
          gte: periodStart,
        },
      },
    });
  }

  async invalidateAllForIdentifierAndPurpose(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<void> {
    await this.prismaOtpClient.updateMany({
      where: {
        phoneNumber: identifier,
        type: this.mapPurposeToPrisma(purpose),
        isVerified: false,
      },
      data: {
        isVerified: true,
        updatedAt: new Date(),
      },
    });
  }

  async hasExceededRateLimit(
    identifier: string,
    purpose: OtpPurpose,
    maxOtpsPerPeriod: number,
    periodMinutes: number
  ): Promise<boolean> {
    const count = await this.countForIdentifierInPeriod(
      identifier,
      purpose,
      periodMinutes
    );

    return count >= maxOtpsPerPeriod;
  }

  private buildWhereClause(filters: OtpFilters): any {
    const where: any = {};

    if (filters.identifier) {
      where.phoneNumber = filters.identifier;
    }

    if (filters.purpose) {
      where.type = this.mapPurposeToPrisma(filters.purpose);
    }

    if (filters.isUsed !== undefined) {
      where.isVerified = filters.isUsed;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};

      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    return where;
  }

  private toDomain(record: any): Otp {
    return Otp.fromPersistence({
      id: record.id,
      requestId: record.requestId,
      phoneNumber: record.phoneNumber,
      purpose: this.mapPurposeFromPrisma(record.type),
      otp: record.otp,
      expiresAt: record.expiresAt,
      maxAttempts: record.maxAttempts,
      attempts: record.attempts,
      isVerified: record.isVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      verifiedAt: record.verifiedAt,
    });
  }

  private mapPurposeToPrisma(purpose: OtpPurpose): OTPType {
    switch (purpose) {
      case 'login':
      case 'mfa':
        return OTPType.login;
      case 'password-reset':
      case 'password_reset':
        return OTPType.password_reset;
      case 'registration':
      case 'transaction':
      case 'kyc':
      default:
        return OTPType.registration;
    }
  }

  private mapPurposeFromPrisma(type: OTPType): OtpPurpose {
    switch (type) {
      case OTPType.login:
        return 'login';
      case OTPType.password_reset:
        return 'password-reset';
      case OTPType.registration:
      default:
        return 'registration';
    }
  }
}