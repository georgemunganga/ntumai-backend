import {
  Injectable,
  BadRequestException,
  UnauthorizedException,

} from '@nestjs/common';
import { OtpSessionRepository } from '../../infrastructure/repositories/otp-session.repository';
import { OtpSessionEntity, FlowType, OtpChannel } from '../../domain/entities/otp-session.entity';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { PhoneNormalizer } from '../utils/phone-normalizer';

@Injectable()
export class OtpServiceV2 {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_TTL_SECONDS = 600; // 10 minutes
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 3600; // 1 hour
  private readonly MAX_REQUESTS_PER_HOUR = 5;

  constructor(
    private readonly sessionRepository: OtpSessionRepository,
    private readonly communicationService: CommunicationService,
  ) {}

  /**
   * Start OTP flow - creates a session and sends OTP
   */
  async startOtpFlow(
    email?: string,
    phone?: string,
    flowType?: FlowType,
    deviceId?: string,
  ): Promise<OtpSessionEntity> {
    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }

    // Normalize phone if provided
    let normalizedPhone: string | undefined;
    if (phone) {
      normalizedPhone = PhoneNormalizer.normalize(phone) ?? undefined;
      if (!normalizedPhone) {
        throw new BadRequestException('Invalid phone number format');
      }
    }

    // Check rate limits
    if (normalizedPhone) {
      await this.checkPhoneRateLimit(normalizedPhone);
    }
    if (email) {
      await this.checkEmailRateLimit(email);
    }

    // Generate OTP
    const otp = this.generateOtp();

    // Determine channels to send OTP
    const channels = this.determineChannels(email, normalizedPhone || undefined);

    // Create session
    const session = new OtpSessionEntity({
      email,
      phone: normalizedPhone,
      otp,
      flowType: flowType || 'signup',
      channelsSent: channels,
      deviceId,
      expiresAt: new Date(Date.now() + this.OTP_TTL_SECONDS * 1000),
    });

    // Save session
    await this.sessionRepository.save(session);

    // Send OTP through selected channels
    await this.sendOtpThroughChannels(otp, email, normalizedPhone || undefined, channels);

    // Return session without OTP
    return this.sanitizeSession(session);
  }

  /**
   * Verify OTP and return verified session
   */
  async verifyOtp(
    sessionId: string,
    otp: string,
    deviceId?: string,
  ): Promise<OtpSessionEntity> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Check if session is expired
    if (session.isExpired()) {
      await this.sessionRepository.delete(sessionId);
      throw new UnauthorizedException('OTP session expired');
    }

    // Check if session is locked
    if (session.isLocked()) {
      throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
    }

    // Check device consistency (optional security measure)
    if (session.deviceId && deviceId && session.deviceId !== deviceId) {
      // Log potential security issue but don't block
      console.warn(`Device mismatch for session ${sessionId}`);
    }

    // Verify OTP
    if (session.otp !== otp) {
      session.incrementAttempt();
      await this.sessionRepository.save(session);
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark as verified
    session.verify();
    await this.sessionRepository.save(session);

    return this.sanitizeSession(session);
  }

  /**
   * Check if session is verified
   */
  async isSessionVerified(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.findById(sessionId);
    return session ? session.status === 'verified' : false;
  }

  /**
   * Get session details (without OTP)
   */
  async getSessionDetails(sessionId: string): Promise<OtpSessionEntity | null> {
    const session = await this.sessionRepository.findById(sessionId);
    return session ? this.sanitizeSession(session) : null;
  }

  /**
   * Invalidate OTP session
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    return this.sessionRepository.delete(sessionId);
  }

  // ==================== Private Methods ====================

  private generateOtp(): string {
    return Math.floor(Math.random() * Math.pow(10, this.OTP_LENGTH))
      .toString()
      .padStart(this.OTP_LENGTH, '0');
  }

  private determineChannels(email?: string, phone?: string): OtpChannel[] {
    const channels: OtpChannel[] = [];

    if (email) channels.push('email');
    if (phone) channels.push('sms');

    // If both available, send to both for security
    return channels.length > 0 ? channels : ['email'];
  }

  private async sendOtpThroughChannels(
    otp: string,
    email?: string,
    phone?: string,
    channels?: OtpChannel[],
  ): Promise<void> {
    const sendChannels = channels || this.determineChannels(email, phone);

    const promises: Promise<void>[] = [];

    if (sendChannels.includes('email') && email) {
      promises.push(
        this.communicationService.sendOtp(email, otp).catch((err) => {
          console.error(`Failed to send OTP via email to ${email}:`, err);
          // Don't throw - continue with other channels
        }),
      );
    }

    if (sendChannels.includes('sms') && phone) {
      promises.push(
        this.communicationService.sendOtp(phone, otp).catch((err) => {
          console.error(`Failed to send OTP via SMS to ${phone}:`, err);
          // Don't throw - continue with other channels
        }),
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  private async checkPhoneRateLimit(phone: string): Promise<void> {
    // This would typically check against a rate limit store
    // For now, we'll implement a simple check
    const recentSession = await this.sessionRepository.findByPhone(phone);
    
    if (recentSession && !recentSession.isExpired()) {
      const timeSinceCreation = Date.now() - recentSession.createdAt.getTime();
      if (timeSinceCreation < 60 * 1000) { // Less than 1 minute
        throw new BadRequestException(
          'Please wait before requesting a new OTP',
        );
      }
    }
  }

  private async checkEmailRateLimit(email: string): Promise<void> {
    // Similar to phone rate limit
    const recentSession = await this.sessionRepository.findByEmail(email);
    
    if (recentSession && !recentSession.isExpired()) {
      const timeSinceCreation = Date.now() - recentSession.createdAt.getTime();
      if (timeSinceCreation < 60 * 1000) { // Less than 1 minute
        throw new BadRequestException(
          'Please wait before requesting a new OTP',
        );
      }
    }
  }

  private sanitizeSession(session: OtpSessionEntity): OtpSessionEntity {
    // Return session without OTP
    const sanitized = new OtpSessionEntity(session);
    sanitized.otp = ''; // Remove OTP from response
    return sanitized;
  }
}
