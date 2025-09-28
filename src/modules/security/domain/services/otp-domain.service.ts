import { BadRequestException, Injectable } from '@nestjs/common';
import { Otp, OtpPurpose, OtpValidationResult } from '../entities/otp.entity';
import { OtpRepository } from '../repositories/otp.repository';
import { OtpGenerationOptions } from '../value-objects/otp-code.value-object';
import { EventPublisher } from '../events/domain-event.base';

export interface GenerateOtpRequest {
  identifier: string;
  purpose: OtpPurpose;
  expiryMinutes?: number;
  maxAttempts?: number;
  codeOptions?: OtpGenerationOptions;
}

export interface ValidateOtpRequest {
  identifier: string;
  code: string;
  purpose: OtpPurpose;
}

export interface OtpRateLimitConfig {
  maxOtpsPerPeriod: number;
  periodMinutes: number;
}

@Injectable()
export class OtpDomainService {
  constructor(
    private readonly otpRepository: OtpRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  /**
   * Generate a new OTP with business rules validation
   */
  async generateOtp(request: GenerateOtpRequest): Promise<Otp> {
    const {
      identifier,
      purpose,
      expiryMinutes = 10,
      maxAttempts = 3,
      codeOptions,
    } = request;

    // Check rate limiting
    await this.checkRateLimit(identifier, purpose);

    // Invalidate any existing valid OTPs for this identifier and purpose
    await this.invalidateExistingOtps(identifier, purpose);

    // Create new OTP
    const otp = await Otp.create(
      identifier,
      purpose,
      expiryMinutes,
      maxAttempts,
      codeOptions
    );

    // Save to repository
    const savedOtp = await this.otpRepository.save(otp);

    // Publish domain events
    await this.publishDomainEvents(savedOtp);

    return savedOtp;
  }

  /**
   * Validate an OTP with business rules
   */
  async validateOtp(request: ValidateOtpRequest): Promise<OtpValidationResult> {
    const { identifier, code, purpose } = request;

    // Find the most recent valid OTP
    const otp = await this.otpRepository.findValidOtp(identifier, purpose);

    if (!otp) {
      return {
        isValid: false,
        remainingAttempts: 0,
      };
    }

    // Validate the OTP
    const result = await otp.validate(code);

    // Save updated OTP state
    await this.otpRepository.save(otp);

    // Publish domain events
    await this.publishDomainEvents(otp);

    return result;
  }

  /**
   * Resend OTP (generate new one if current is still valid for resending)
   */
  async resendOtp(
    identifier: string,
    purpose: OtpPurpose,
    codeOptions?: OtpGenerationOptions
  ): Promise<Otp> {
    // Check if there's an existing OTP that can be resent
    const existingOtp = await this.otpRepository.findValidOtp(identifier, purpose);
    
    if (existingOtp && !existingOtp.canResend()) {
      throw new BadRequestException(
        'Cannot resend OTP. Maximum attempts reached or OTP already used.'
      );
    }

    // Generate new OTP (this will invalidate the existing one)
    return this.generateOtp({
      identifier,
      purpose,
      codeOptions,
    });
  }

  /**
   * Invalidate OTP manually
   */
  async invalidateOtp(otpId: string): Promise<void> {
    const otp = await this.otpRepository.findById(otpId);
    
    if (!otp) {
      throw new BadRequestException('OTP not found');
    }

    otp.invalidate();
    await this.otpRepository.save(otp);
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOtps(): Promise<number> {
    return this.otpRepository.deleteExpired();
  }

  /**
   * Get OTP statistics for an identifier
   */
  async getOtpStats(
    identifier: string,
    purpose: OtpPurpose,
    periodMinutes: number = 60
  ): Promise<{
    totalGenerated: number;
    totalValidated: number;
    hasValidOtp: boolean;
  }> {
    const periodStart = new Date(Date.now() - periodMinutes * 60 * 1000);
    
    const totalGenerated = await this.otpRepository.countForIdentifierInPeriod(
      identifier,
      purpose,
      periodMinutes
    );

    const validOtp = await this.otpRepository.findValidOtp(identifier, purpose);
    
    const allOtps = await this.otpRepository.findMany({
      identifier,
      purpose,
      createdAfter: periodStart,
    });

    const totalValidated = allOtps.filter(otp => otp.isUsed).length;

    return {
      totalGenerated,
      totalValidated,
      hasValidOtp: !!validOtp,
    };
  }

  private async checkRateLimit(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<void> {
    const rateLimitConfig = this.getRateLimitConfig(purpose);
    
    const hasExceeded = await this.otpRepository.hasExceededRateLimit(
      identifier,
      purpose,
      rateLimitConfig.maxOtpsPerPeriod,
      rateLimitConfig.periodMinutes
    );

    if (hasExceeded) {
      throw new BadRequestException(
        `Rate limit exceeded. Maximum ${rateLimitConfig.maxOtpsPerPeriod} OTPs per ${rateLimitConfig.periodMinutes} minutes.`
      );
    }
  }

  private async invalidateExistingOtps(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<void> {
    await this.otpRepository.invalidateAllForIdentifierAndPurpose(
      identifier,
      purpose
    );
  }

  private async publishDomainEvents(otp: Otp): Promise<void> {
    const events = otp.domainEvents;
    if (events.length > 0) {
      await this.eventPublisher.publishAll(events);
      otp.clearDomainEvents();
    }
  }

  private getRateLimitConfig(purpose: OtpPurpose): OtpRateLimitConfig {
    // Different rate limits based on purpose
    switch (purpose) {
      case 'login':
        return { maxOtpsPerPeriod: 5, periodMinutes: 15 };
      case 'registration':
        return { maxOtpsPerPeriod: 3, periodMinutes: 30 };
      case 'password-reset':
        return { maxOtpsPerPeriod: 3, periodMinutes: 60 };
      case 'transaction':
        return { maxOtpsPerPeriod: 10, periodMinutes: 60 };
      case 'kyc':
        return { maxOtpsPerPeriod: 5, periodMinutes: 30 };
      case 'mfa':
        return { maxOtpsPerPeriod: 10, periodMinutes: 15 };
      default:
        return { maxOtpsPerPeriod: 3, periodMinutes: 15 };
    }
  }
}