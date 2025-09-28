<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface GenerateOtpOptions {
  identifier: string;
  purpose: string;
  expiryMinutes?: number;
  codeLength?: number;
  alphanumeric?: boolean;
}

interface ValidateOtpOptions {
  identifier: string;
  code: string;
  purpose: string;
  otpId?: string;
}

interface OtpRecord {
  identifier: string;
  purpose: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpApplicationService {
  private readonly otpStore = new Map<string, OtpRecord>();

  async generateOtp(options: GenerateOtpOptions) {
    const {
      identifier,
      purpose,
      expiryMinutes = 5,
      codeLength = 6,
      alphanumeric = false,
    } = options;

    const code = this.generateCode(codeLength, alphanumeric);
    const otpId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

    this.otpStore.set(otpId, {
      identifier: identifier.toLowerCase(),
      purpose,
      code,
=======
import { Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '@common/prisma/prisma.service';
import { OTPType } from '@prisma/client';
import {
  GenerateOtpOptions,
  GenerateOtpResult,
  OtpDeliveryStatus,
  OtpPurpose,
  ValidateOtpOptions,
  ValidateOtpResult,
} from '../../domain/entities/otp.entity';

@Injectable()
export class OtpApplicationService {
  private readonly logger = new Logger(OtpApplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateOtp(options: GenerateOtpOptions): Promise<GenerateOtpResult> {
    const purpose = this.mapPurpose(options.purpose);
    const channel = this.detectChannel(options.identifier);
    const otp = this.generateCode(options.codeLength ?? 6, options.alphanumeric ?? false);
    const expiresAt = new Date(Date.now() + (options.expiryMinutes ?? 5) * 60_000);
    const requestId = randomUUID();

    await this.prisma.oTPVerification.deleteMany({
      where: {
        phoneNumber: options.identifier,
        type: purpose,
      },
    });

    await this.prisma.oTPVerification.create({
      data: {
        requestId,
        phoneNumber: options.identifier,
        countryCode: options.countryCode ?? (channel === 'email' ? 'EMAIL' : 'INTL'),
        otp,
        type: purpose,
        expiresAt,
        maxAttempts: 5,
      },
    });

    const deliveryStatus: OtpDeliveryStatus = {
      sent: true,
      channel,
    };

    this.logger.debug(`Generated OTP for ${options.identifier}`, {
      purpose: options.purpose,
      requestId,
>>>>>>> main
      expiresAt,
    });

    return {
<<<<<<< HEAD
      otpId,
      code,
      expiresAt,
      deliveryStatus: {
        sent: true,
        channel: identifier.includes('@') ? 'email' : 'sms',
        error: undefined,
      },
    };
  }

  async validateOtp(options: ValidateOtpOptions) {
    const { identifier, code, purpose, otpId } = options;
    const normalizedIdentifier = identifier.toLowerCase();

    const matchingEntry = otpId
      ? this.lookupById(otpId)
      : this.lookupByIdentifier(normalizedIdentifier, purpose);

    if (!matchingEntry) {
      return { isValid: false };
    }

    const [id, record] = matchingEntry;

    if (record.identifier !== normalizedIdentifier || record.purpose !== purpose) {
      return { isValid: false };
    }

    if (record.expiresAt.getTime() < Date.now()) {
      this.otpStore.delete(id);
      return { isValid: false };
    }

    if (record.code !== code) {
      return { isValid: false };
    }

    this.otpStore.delete(id);
    return { isValid: true };
  }

  private lookupById(otpId: string): [string, OtpRecord] | undefined {
    const record = this.otpStore.get(otpId);
    return record ? [otpId, record] : undefined;
  }

  private lookupByIdentifier(identifier: string, purpose: string): [string, OtpRecord] | undefined {
    for (const entry of this.otpStore.entries()) {
      const [, record] = entry;
      if (record.identifier === identifier && record.purpose === purpose) {
        return entry;
      }
    }
    return undefined;
=======
      otpId: requestId,
      expiresAt,
      deliveryStatus,
    };
  }

  async validateOtp(options: ValidateOtpOptions): Promise<ValidateOtpResult> {
    const purpose = options.purpose ? this.mapPurpose(options.purpose) : undefined;

    const otpRecord = await this.prisma.oTPVerification.findFirst({
      where: {
        ...(options.requestId ? { requestId: options.requestId } : { phoneNumber: options.identifier }),
        ...(purpose ? { type: purpose } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { isValid: false, attemptsRemaining: 0, isExpired: false };
    }

    const now = new Date();
    const isExpired = otpRecord.expiresAt < now;

    if (isExpired) {
      return { isValid: false, attemptsRemaining: 0, isExpired: true };
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return { isValid: false, attemptsRemaining: 0, isExpired: false };
    }

    const isValid = otpRecord.otp === options.code;

    if (isValid) {
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: {
          isVerified: true,
          verifiedAt: now,
        },
      });

      return {
        isValid: true,
        attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts,
        isExpired: false,
      };
    }

    const updated = await this.prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: otpRecord.attempts + 1,
      },
    });

    return {
      isValid: false,
      attemptsRemaining: Math.max(updated.maxAttempts - updated.attempts, 0),
      isExpired: false,
    };
  }

  private mapPurpose(purpose: OtpPurpose): OTPType {
    switch (purpose) {
      case 'registration':
        return OTPType.registration;
      case 'login':
        return OTPType.login;
      case 'password_reset':
        return OTPType.password_reset;
      default:
        return OTPType.registration;
    }
  }

  private detectChannel(identifier: string): 'sms' | 'email' {
    return identifier.includes('@') ? 'email' : 'sms';
>>>>>>> main
  }

  private generateCode(length: number, alphanumeric: boolean): string {
    if (alphanumeric) {
<<<<<<< HEAD
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * characters.length);
        result += characters[index];
      }
      return result;
    }

    const max = 10 ** length;
    const min = 10 ** (length - 1);
    return Math.floor(Math.random() * (max - min) + min).toString();
=======
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        const index = randomInt(0, chars.length);
        code += chars[index];
      }
      return code;
    }

    let code = '';
    for (let i = 0; i < length; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
>>>>>>> main
  }
}
