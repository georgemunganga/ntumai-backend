import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  IOtpService,
  GenerateOtpRequest,
  OtpGenerationOptions,
  OtpOperationResult,
  ValidateOtpRequest,
  OtpValidationResponse,
  ResendOtpRequest,
} from '../interfaces/security.interface';
import { OTPType } from '@prisma/client';
import * as crypto from 'crypto';

interface FallbackOtpRecord {
  otpId: string;
  identifier: string;
  purpose: string;
  hashedCode: string;
  expiresAt: Date;
  maxAttempts: number;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class OtpService implements IOtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly defaultOptions: Required<OtpGenerationOptions> = {
    length: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
    alphanumeric: false,
  };

  private readonly fallbackStore = new Map<string, FallbackOtpRecord>();
  private readonly fallbackIndex = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  private get otpRepository(): any | null {
    return (this.prisma as any).oTPVerification ?? null;
  }

  async generateOtp(request: GenerateOtpRequest): Promise<OtpOperationResult> {
    const identifier = request.identifier?.trim();
    const purpose = request.purpose?.trim();

    if (!identifier) {
      return { success: false, error: 'Identifier is required to generate OTP' };
    }

    if (!purpose) {
      return { success: false, error: 'Purpose is required to generate OTP' };
    }

    const options = { ...this.defaultOptions, ...request.options };
    const expiryMinutes = request.expiryMinutes ?? options.expiryMinutes;
    const maxAttempts = request.maxAttempts ?? options.maxAttempts;

    await this.invalidateOtp({ identifier, purpose });

    const otpId = crypto.randomUUID();
    const otpCode = this.generateOtpCode(options.length, options.alphanumeric);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const hashedCode = await this.hashOtpCode(otpCode);

    const repository = this.otpRepository;

    try {
      if (repository) {
        await repository.create({
          data: {
            requestId: otpId,
            phoneNumber: identifier,
            countryCode: identifier.includes('@') ? 'EMAIL' : 'INTL',
            otp: hashedCode,
            type: this.mapPurpose(purpose),
            isVerified: false,
            attempts: 0,
            maxAttempts,
            expiresAt,
          },
        });
      } else {
        this.storeFallbackRecord({
          otpId,
          identifier,
          purpose,
          hashedCode,
          expiresAt,
          maxAttempts,
          attempts: 0,
          createdAt: new Date(),
        });
      }

      this.logger.log(`OTP generated for ${identifier} with purpose ${purpose}`);

      return {
        success: true,
        otpId,
        otpCode,
        expiresAt,
        attemptsRemaining: maxAttempts,
        deliveryStatus: {
          sent: true,
          channel: this.detectChannel(identifier),
        },
        metadata: request.metadata,
      };
    } catch (error: any) {
      this.logger.error('Failed to generate OTP', error);
      return {
        success: false,
        error: error?.message ?? 'Failed to generate OTP',
      };
    }
  }

  async validateOtp(request: ValidateOtpRequest): Promise<OtpValidationResponse> {
    const code = request.code?.trim();
    if (!code) {
      return { success: false, error: 'OTP code is required' };
    }

    const repository = this.otpRepository;
    const now = new Date();

    if (repository) {
      const where: any = {};

      if (request.otpId) {
        where.requestId = request.otpId;
      } else {
        const identifier = request.identifier?.trim();
        const purpose = request.purpose?.trim();

        if (!identifier || !purpose) {
          return {
            success: false,
            error: 'Identifier and purpose are required to validate OTP',
          };
        }

        where.phoneNumber = identifier;
        where.type = this.mapPurpose(purpose);
      }

      const record = await repository.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return {
          success: false,
          error: 'Invalid or expired OTP',
          attemptsRemaining: 0,
        };
      }

      if (record.expiresAt < now) {
        return {
          success: false,
          error: 'OTP expired',
          isExpired: true,
          attemptsRemaining: 0,
        };
      }

      if (record.attempts >= record.maxAttempts) {
        return {
          success: false,
          error: 'Maximum attempts exceeded',
          attemptsExceeded: true,
          attemptsRemaining: 0,
        };
      }

      const isValid = await this.verifyOtpCode(code, record.otp);

      if (isValid) {
        await repository.update({
          where: { id: record.id },
          data: {
            isVerified: true,
            verifiedAt: now,
          },
        });

        return {
          success: true,
          attemptsRemaining: record.maxAttempts - record.attempts,
        };
      }

      const updated = await repository.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });

      return {
        success: false,
        error: 'Invalid OTP code',
        attemptsExceeded: updated.attempts >= updated.maxAttempts,
        attemptsRemaining: Math.max(updated.maxAttempts - updated.attempts, 0),
      };
    }

    const fallback = this.resolveFallbackRecord(request);
    if (!fallback) {
      return {
        success: false,
        error: 'Invalid or expired OTP',
        attemptsRemaining: 0,
      };
    }

    if (fallback.expiresAt < now) {
      this.removeFallbackRecord(fallback.otpId);
      return {
        success: false,
        error: 'OTP expired',
        isExpired: true,
        attemptsRemaining: 0,
      };
    }

    if (fallback.attempts >= fallback.maxAttempts) {
      return {
        success: false,
        error: 'Maximum attempts exceeded',
        attemptsExceeded: true,
        attemptsRemaining: 0,
      };
    }

    const isValid = await this.verifyOtpCode(code, fallback.hashedCode);

    if (isValid) {
      this.removeFallbackRecord(fallback.otpId);
      return {
        success: true,
        attemptsRemaining: fallback.maxAttempts - fallback.attempts,
      };
    }

    fallback.attempts += 1;
    this.fallbackStore.set(fallback.otpId, fallback);

    return {
      success: false,
      error: 'Invalid OTP code',
      attemptsExceeded: fallback.attempts >= fallback.maxAttempts,
      attemptsRemaining: Math.max(fallback.maxAttempts - fallback.attempts, 0),
    };
  }

  async resendOtp(request: ResendOtpRequest): Promise<OtpOperationResult> {
    const repository = this.otpRepository;
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    if (repository) {
      const where: any = {};

      if (request.originalOtpId) {
        where.requestId = request.originalOtpId;
      } else {
        const identifier = request.identifier?.trim();
        const purpose = request.purpose?.trim();

        if (!identifier || !purpose) {
          return {
            success: false,
            error: 'Identifier and purpose are required to resend OTP',
          };
        }

        where.phoneNumber = identifier;
        where.type = this.mapPurpose(purpose);
      }

      const existing = await repository.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (!existing) {
        return { success: false, error: 'No OTP found to resend' };
      }

      if (existing.createdAt > oneMinuteAgo) {
        return {
          success: false,
          error: 'Please wait before requesting another OTP',
        };
      }

      const identifier = existing.phoneNumber ?? request.identifier ?? '';
      const purpose = this.normalizePurposeKey(request.purpose ?? existing.type ?? 'registration');

      return this.generateOtp({
        identifier,
        purpose,
        expiryMinutes: request.newExpiryMinutes,
        maxAttempts: request.options?.maxAttempts,
        options: request.options,
        metadata: request.metadata,
      });
    }

    const fallback = request.originalOtpId
      ? this.fallbackStore.get(request.originalOtpId)
      : this.resolveFallbackRecord({
          otpId: undefined,
          identifier: request.identifier,
          purpose: request.purpose,
          code: 'noop',
        });

    if (!fallback) {
      return { success: false, error: 'No OTP found to resend' };
    }

    if (fallback.createdAt > oneMinuteAgo) {
      return {
        success: false,
        error: 'Please wait before requesting another OTP',
      };
    }

    return this.generateOtp({
      identifier: fallback.identifier,
      purpose: fallback.purpose,
      expiryMinutes: request.newExpiryMinutes,
      maxAttempts: request.options?.maxAttempts,
      options: request.options,
      metadata: request.metadata,
    });
  }

  async invalidateOtp(request: { otpId?: string; identifier?: string; purpose?: string }): Promise<void> {
    const repository = this.otpRepository;

    if (repository) {
      const where: any = {};

      if (request.otpId) {
        where.requestId = request.otpId;
      }

      if (request.identifier) {
        where.phoneNumber = request.identifier;
      }

      if (request.purpose) {
        where.type = this.mapPurpose(request.purpose);
      }

      if (Object.keys(where).length > 0) {
        await repository.deleteMany({ where });
      }
    }

    if (request.otpId) {
      this.removeFallbackRecord(request.otpId);
    }

    if (request.identifier && request.purpose) {
      const key = this.getStoreKey(request.identifier, request.purpose);
      const otpId = this.fallbackIndex.get(key);
      if (otpId) {
        this.removeFallbackRecord(otpId);
      }
    }
  }

  async cleanupExpiredOtps(): Promise<void> {
    const repository = this.otpRepository;
    const now = new Date();

    if (repository) {
      const result = await repository.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired OTPs`);
    }

    for (const record of [...this.fallbackStore.values()]) {
      if (record.expiresAt < now) {
        this.removeFallbackRecord(record.otpId);
      }
    }
  }

  private generateOtpCode(length: number, alphanumeric: boolean): string {
    const chars = alphanumeric ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  private async hashOtpCode(code: string): Promise<string> {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async verifyOtpCode(code: string, hashedCode: string): Promise<boolean> {
    const hashedInput = await this.hashOtpCode(code);
    return hashedInput === hashedCode;
  }

  private detectChannel(identifier: string): 'sms' | 'email' | 'unknown' {
    if (!identifier) {
      return 'unknown';
    }

    if (identifier.includes('@')) {
      return 'email';
    }

    return 'sms';
  }

  private mapPurpose(purpose: string): OTPType {
    const normalized = this.normalizePurposeKey(purpose);

    switch (normalized) {
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

  private normalizePurposeKey(purpose: string): string {
    return purpose.replace(/\s+/g, '-').replace(/_/g, '-').toLowerCase();
  }

  private getStoreKey(identifier: string, purpose: string): string {
    return `${identifier}::${this.normalizePurposeKey(purpose)}`;
  }

  private storeFallbackRecord(record: FallbackOtpRecord): void {
    this.fallbackStore.set(record.otpId, record);
    this.fallbackIndex.set(this.getStoreKey(record.identifier, record.purpose), record.otpId);
  }

  private resolveFallbackRecord(request: ValidateOtpRequest): FallbackOtpRecord | undefined {
    if (request.otpId) {
      return this.fallbackStore.get(request.otpId);
    }

    const identifier = request.identifier?.trim();
    const purpose = request.purpose?.trim();

    if (!identifier || !purpose) {
      return undefined;
    }

    const otpId = this.fallbackIndex.get(this.getStoreKey(identifier, purpose));
    return otpId ? this.fallbackStore.get(otpId) : undefined;
  }

  private removeFallbackRecord(otpId: string): void {
    const record = this.fallbackStore.get(otpId);
    if (!record) {
      return;
    }

    this.fallbackStore.delete(otpId);
    this.fallbackIndex.delete(this.getStoreKey(record.identifier, record.purpose));
  }
}
