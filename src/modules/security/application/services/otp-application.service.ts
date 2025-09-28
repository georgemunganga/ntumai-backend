import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomInt, randomUUID, createHash } from 'crypto';
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
    const normalizedIdentifier = this.normalizeIdentifier(options.identifier);
    const purpose = this.mapPurpose(options.purpose);
    const channel = this.detectChannel(normalizedIdentifier);
    const otp = this.generateCode(options.codeLength ?? 6, options.alphanumeric ?? false);
    const expiresAt = new Date(Date.now() + (options.expiryMinutes ?? 5) * 60_000);
    const requestId = randomUUID();
    const maxAttempts = options.maxAttempts ?? 5;
    const resendCooldownSeconds = options.resendCooldownSeconds ?? 60;
    const resendAvailableAt = new Date(Date.now() + resendCooldownSeconds * 1000);

    await this.prisma.oTPVerification.deleteMany({
      where: {
        identifier: normalizedIdentifier,
        type: purpose,
      },
    });

    await this.prisma.oTPVerification.create({
      data: {
        requestId,
        identifier: normalizedIdentifier,
        otpHash: this.hashCode(otp),
        type: purpose,
        expiresAt,
        maxAttempts,
        resendAvailableAt,
      },
    });

    const deliveryStatus: OtpDeliveryStatus = {
      sent: true,
      channel,
    };

    this.logger.debug(`Generated OTP for ${normalizedIdentifier}`, {
      purpose: options.purpose,
      requestId,
      expiresAt,
    });

    return {
      otpId: requestId,
      expiresAt,
      deliveryStatus,
      resendAvailableAt,
      maxAttempts,
    };
  }

  async validateOtp(options: ValidateOtpOptions): Promise<ValidateOtpResult> {
    const requestId = options.challengeId ?? options.requestId;

    if (!requestId) {
      throw new BadRequestException('challengeId is required for OTP verification');
    }

    const otpRecord = await this.prisma.oTPVerification.findUnique({
      where: { requestId },
    });

    if (!otpRecord) {
      return {
        isValid: false,
        attemptsRemaining: 0,
        isExpired: false,
        isLocked: false,
      };
    }

    const now = new Date();
    const isExpired = otpRecord.expiresAt.getTime() <= now.getTime();

    if (otpRecord.consumedAt) {
      return {
        isValid: false,
        attemptsRemaining: 0,
        isExpired: isExpired,
        isLocked: true,
      };
    }

    if (isExpired) {
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { consumedAt: now },
      });

      return {
        isValid: false,
        attemptsRemaining: 0,
        isExpired: true,
        isLocked: false,
      };
    }

    const hashedInput = this.hashCode(options.code);
    const isValid = otpRecord.otpHash === hashedInput;

    if (!isValid) {
      const nextAttempts = otpRecord.attempts + 1;
      const locked = nextAttempts >= otpRecord.maxAttempts;

      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: nextAttempts,
          ...(locked ? { consumedAt: now } : {}),
        },
      });

      return {
        isValid: false,
        attemptsRemaining: Math.max(otpRecord.maxAttempts - nextAttempts, 0),
        isExpired: false,
        isLocked: locked,
      };
    }

    await this.prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: {
        attempts: otpRecord.attempts + 1,
        isVerified: true,
        consumedAt: now,
      },
    });

    return {
      isValid: true,
      attemptsRemaining: Math.max(otpRecord.maxAttempts - (otpRecord.attempts + 1), 0),
      isExpired: false,
      isLocked: false,
      challengeId: otpRecord.requestId,
      identifier: otpRecord.identifier,
      purpose: this.reverseMapPurpose(otpRecord.type),
    };
  }

  private normalizeIdentifier(identifier: string): string {
    return identifier.trim().toLowerCase();
  }

  private mapPurpose(purpose: OtpPurpose): OTPType {
    switch (purpose) {
      case 'registration':
        return OTPType.REGISTRATION;
      case 'login':
        return OTPType.LOGIN;
      case 'password_reset':
        return OTPType.PASSWORD_RESET;
      default:
        return OTPType.REGISTRATION;
    }
  }

  private reverseMapPurpose(type: OTPType): OtpPurpose {
    switch (type) {
      case OTPType.LOGIN:
        return 'login';
      case OTPType.PASSWORD_RESET:
        return 'password_reset';
      default:
        return 'registration';
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

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
