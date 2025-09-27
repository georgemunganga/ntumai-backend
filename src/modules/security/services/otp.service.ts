import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IOtpService, OtpPayload, OtpGenerationOptions, OtpValidationResult } from '../interfaces/security.interface';
import { OTPType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OtpService implements IOtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly defaultOptions: Required<OtpGenerationOptions> = {
    length: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
    alphanumeric: false,
  };

  private readonly fallbackStore = new Map<
    string,
    {
      hashedCode: string;
      expiresAt: Date;
      maxAttempts: number;
      attempts: number;
      createdAt: Date;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private get otpRepository(): any | null {
    return (this.prisma as any).oTPVerification ?? null;
  }

  private getStoreKey(identifier: string, purpose: OtpPayload['purpose']): string {
    return `${identifier}::${purpose}`;
  }

  async generateOtp(
    identifier: string,
    purpose: OtpPayload['purpose'],
    options?: OtpGenerationOptions,
  ): Promise<string>;

  async generateOtp(request: {
    identifier: string;
    purpose: OtpPayload['purpose'];
    options?: OtpGenerationOptions;
  }): Promise<string>;

  async generateOtp(
    identifierOrRequest:
      | string
      | { identifier: string; purpose: OtpPayload['purpose']; options?: OtpGenerationOptions },
    purposeOrOptions?: OtpPayload['purpose'] | OtpGenerationOptions,
    maybeOptions?: OtpGenerationOptions,
  ): Promise<string> {
    const { identifier, purpose, options } =
      typeof identifierOrRequest === 'string'
        ? {
            identifier: identifierOrRequest,
            purpose: purposeOrOptions as OtpPayload['purpose'],
            options: maybeOptions,
          }
        : {
            identifier: identifierOrRequest.identifier,
            purpose: identifierOrRequest.purpose,
            options: identifierOrRequest.options,
          };

    if (!purpose) {
      throw new Error('OTP purpose must be provided');
    }

    const opts = { ...this.defaultOptions, ...options };

    await this.invalidateOtp(identifier, purpose);

    const code = this.generateOtpCode(opts.length, opts.alphanumeric);
    const expiresAt = new Date(Date.now() + opts.expiryMinutes * 60 * 1000);
    const hashedCode = await this.hashOtpCode(code);

    const repository = this.otpRepository;
    if (repository) {
      await repository.create({
        data: {
          requestId: crypto.randomUUID(),
          phoneNumber: identifier,
          countryCode: identifier.includes('@') ? 'EMAIL' : 'INTL',
          otp: hashedCode,
          type: this.mapPurpose(purpose),
          isVerified: false,
          attempts: 0,
          maxAttempts: opts.maxAttempts,
          expiresAt,
        },
      });
    } else {
      const key = this.getStoreKey(identifier, purpose);
      this.fallbackStore.set(key, {
        hashedCode,
        expiresAt,
        maxAttempts: opts.maxAttempts,
        attempts: 0,
        createdAt: new Date(),
      });
    }

    this.logger.log(`OTP generated for ${identifier} with purpose ${purpose}`);
    return code;
  }

  async validateOtp(
    identifier: string,
    code: string,
    purpose: OtpPayload['purpose'],
  ): Promise<OtpValidationResult>;

  async validateOtp(request: {
    identifier: string;
    code: string;
    purpose: OtpPayload['purpose'];
  }): Promise<OtpValidationResult>;

  async validateOtp(
    identifierOrRequest:
      | string
      | { identifier: string; code: string; purpose: OtpPayload['purpose'] },
    codeOrPurpose?: string | OtpPayload['purpose'],
    maybePurpose?: OtpPayload['purpose'],
  ): Promise<OtpValidationResult> {
    const { identifier, code, purpose } =
      typeof identifierOrRequest === 'string'
        ? {
            identifier: identifierOrRequest,
            code: codeOrPurpose as string,
            purpose: maybePurpose as OtpPayload['purpose'],
          }
        : identifierOrRequest;

    if (!identifier || !code || !purpose) {
      throw new Error('Identifier, code, and purpose are required to validate an OTP');
    }

    const repository = this.otpRepository;
    const now = new Date();

    if (repository) {
      const record = await repository.findFirst({
        where: {
          phoneNumber: identifier,
          type: this.mapPurpose(purpose),
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return { isValid: false, isExpired: false, attemptsExceeded: false, remainingAttempts: 0 };
      }

      if (record.expiresAt < now) {
        return { isValid: false, isExpired: true, attemptsExceeded: false, remainingAttempts: 0 };
      }

      if (record.attempts >= record.maxAttempts) {
        return { isValid: false, isExpired: false, attemptsExceeded: true, remainingAttempts: 0 };
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
          isValid: true,
          isExpired: false,
          attemptsExceeded: false,
          remainingAttempts: record.maxAttempts - record.attempts,
        };
      }

      const updated = await repository.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });

      return {
        isValid: false,
        isExpired: false,
        attemptsExceeded: updated.attempts >= updated.maxAttempts,
        remainingAttempts: Math.max(updated.maxAttempts - updated.attempts, 0),
      };
    }

    const key = this.getStoreKey(identifier, purpose);
    const record = this.fallbackStore.get(key);

    if (!record) {
      return { isValid: false, isExpired: false, attemptsExceeded: false, remainingAttempts: 0 };
    }

    if (record.expiresAt < now) {
      this.fallbackStore.delete(key);
      return { isValid: false, isExpired: true, attemptsExceeded: false, remainingAttempts: 0 };
    }

    if (record.attempts >= record.maxAttempts) {
      return { isValid: false, isExpired: false, attemptsExceeded: true, remainingAttempts: 0 };
    }

    const isValid = await this.verifyOtpCode(code, record.hashedCode);

    if (isValid) {
      this.fallbackStore.delete(key);
      return {
        isValid: true,
        isExpired: false,
        attemptsExceeded: false,
        remainingAttempts: record.maxAttempts - record.attempts,
      };
    }

    const attempts = record.attempts + 1;
    this.fallbackStore.set(key, { ...record, attempts });

    return {
      isValid: false,
      isExpired: false,
      attemptsExceeded: attempts >= record.maxAttempts,
      remainingAttempts: Math.max(record.maxAttempts - attempts, 0),
    };
  }

  async resendOtp(
    identifier: string,
    purpose: OtpPayload['purpose'],
  ): Promise<string>;

  async resendOtp(request: {
    identifier: string;
    purpose: OtpPayload['purpose'];
  }): Promise<string>;

  async resendOtp(
    identifierOrRequest: string | { identifier: string; purpose: OtpPayload['purpose'] },
    maybePurpose?: OtpPayload['purpose'],
  ): Promise<string> {
    const { identifier, purpose } =
      typeof identifierOrRequest === 'string'
        ? { identifier: identifierOrRequest, purpose: maybePurpose as OtpPayload['purpose'] }
        : identifierOrRequest;

    if (!purpose) {
      throw new Error('OTP purpose must be provided');
    }

    const repository = this.otpRepository;
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    if (repository) {
      const recentOtp = await repository.findFirst({
        where: {
          phoneNumber: identifier,
          type: this.mapPurpose(purpose),
          createdAt: { gt: oneMinuteAgo },
        },
      });

      if (recentOtp) {
        throw new Error('Please wait before requesting another OTP');
      }

      return this.generateOtp(identifier, purpose);
    }

    const key = this.getStoreKey(identifier, purpose);
    const record = this.fallbackStore.get(key);

    if (record && record.createdAt > oneMinuteAgo) {
      throw new Error('Please wait before requesting another OTP');
    }

    return this.generateOtp(identifier, purpose);
  }

  async invalidateOtp(
    identifier: string,
    purpose: OtpPayload['purpose'],
  ): Promise<void> {
    const repository = this.otpRepository;

    if (repository) {
      await repository.deleteMany({
        where: {
          phoneNumber: identifier,
          type: this.mapPurpose(purpose),
        },
      });
    }

    this.fallbackStore.delete(this.getStoreKey(identifier, purpose));

    this.logger.log(`OTP invalidated for ${identifier} with purpose ${purpose}`);
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

    for (const [key, value] of this.fallbackStore.entries()) {
      if (value.expiresAt < now) {
        this.fallbackStore.delete(key);
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

  private mapPurpose(purpose: OtpPayload['purpose']): OTPType {
    switch (purpose) {
      case 'login':
        return OTPType.login;
      case 'password-reset':
        return OTPType.password_reset;
      case 'transaction':
      case 'kyc':
      case 'mfa':
        return OTPType.registration;
      case 'registration':
      default:
        return OTPType.registration;
    }
  }
}