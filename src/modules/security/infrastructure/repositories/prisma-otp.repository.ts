import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Otp, OtpPurpose } from '../../domain/entities/otp.entity';
import {
  OtpRepository,
  FindOtpOptions,
  OtpFilters,
  PaginationOptions,
  PaginatedOtpResult,
} from '../../domain/repositories/otp.repository';
import { OtpCode } from '../../domain/value-objects/otp-code.value-object';

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
      where: { id: data.id },
      update: {
        code: data.code,
        attempts: data.attempts,
        isUsed: data.isUsed,
        updatedAt: data.updatedAt,
      },
      create: {
        id: data.id,
        identifier: data.identifier,
        code: data.code,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        maxAttempts: data.maxAttempts,
        attempts: data.attempts,
        isUsed: data.isUsed,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return Otp.fromPersistence(savedData);
  }

  async findById(id: string): Promise<Otp | null> {
    const data = await this.prismaOtpClient.findUnique({
      where: { id },
    });

    return data ? Otp.fromPersistence(data) : null;
  }

  async findValidOtp(identifier: string, purpose: OtpPurpose): Promise<Otp | null> {
    const data = await this.prismaOtpClient.findFirst({
      where: {
        identifier,
        purpose,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data ? Otp.fromPersistence(data) : null;
  }

  async findOne(options: FindOtpOptions): Promise<Otp | null> {
    const where: any = {};

    if (options.identifier) {
      where.identifier = options.identifier;
    }

    if (options.purpose) {
      where.purpose = options.purpose;
    }

    if (options.isUsed !== undefined) {
      where.isUsed = options.isUsed;
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

    return data ? Otp.fromPersistence(data) : null;
  }

  async findMany(filters: OtpFilters): Promise<Otp[]> {
    const where = this.buildWhereClause(filters);

    const data = await this.prismaOtpClient.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data.map(item => Otp.fromPersistence(item));
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

    const otps = data.map(item => Otp.fromPersistence(item));
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
      where: { id },
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
        identifier,
        purpose,
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
        identifier,
        purpose,
        isUsed: false,
      },
      data: {
        isUsed: true,
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
      where.identifier = filters.identifier;
    }

    if (filters.purpose) {
      where.purpose = filters.purpose;
    }

    if (filters.isUsed !== undefined) {
      where.isUsed = filters.isUsed;
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
}