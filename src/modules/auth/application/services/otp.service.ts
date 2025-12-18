import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/shared/infrastructure/redis.service';
import { CommunicationsService } from '../../../communications/communications.service';

@Injectable()
export class OtpService {
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly redisService: RedisService,
    private readonly communicationService: CommunicationsService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpKey(identifier: string): string {
    return `otp:${identifier}`;
  }

  async requestOtp(identifier: string): Promise<void> {
    const otp = this.generateOtp();
    const key = this.getOtpKey(identifier);

    // Store OTP in Redis with a 5-minute expiry
    await this.redisService.set(key, otp, this.OTP_TTL_SECONDS);

    // Send OTP via communication service
    await this.communicationService.sendOtp(identifier, otp);
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const key = this.getOtpKey(identifier);
    const storedOtp = await this.redisService.get(key);

    if (storedOtp === otp) {
      // OTP is valid, delete it to prevent reuse
      await this.redisService.del(key);
      return true;
    }

    return false;
  }
}
