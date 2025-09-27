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
      expiresAt,
    });

    return {
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
  }

  private generateCode(length: number, alphanumeric: boolean): string {
    if (alphanumeric) {
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
  }
}
