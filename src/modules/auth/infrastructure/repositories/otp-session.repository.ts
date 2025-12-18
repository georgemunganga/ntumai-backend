import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/shared/infrastructure/redis.service';
import { OtpSessionEntity } from '../../domain/entities/otp-session.entity';
import { IOtpSessionRepository } from '../../domain/repositories/otp-session.repository.interface';

@Injectable()
export class OtpSessionRepository implements IOtpSessionRepository {
  private readonly PREFIX = 'otp_session:';
  private readonly EMAIL_INDEX = 'otp_email_index:';
  private readonly PHONE_INDEX = 'otp_phone_index:';

  constructor(private readonly redisService: RedisService) {}

  async findById(id: string): Promise<OtpSessionEntity | null> {
    const data = await this.redisService.get(`${this.PREFIX}${id}`);
    if (!data) return null;
    return this.mapToEntity(JSON.parse(data));
  }

  async findByEmail(email: string): Promise<OtpSessionEntity | null> {
    const sessionId = await this.redisService.get(
      `${this.EMAIL_INDEX}${email}`,
    );
    if (!sessionId) return null;
    return this.findById(sessionId);
  }

  async findByPhone(phone: string): Promise<OtpSessionEntity | null> {
    const sessionId = await this.redisService.get(
      `${this.PHONE_INDEX}${phone}`,
    );
    if (!sessionId) return null;
    return this.findById(sessionId);
  }

  async save(session: OtpSessionEntity): Promise<OtpSessionEntity> {
    const ttl = Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000);

    // Save main session
    await this.redisService.set(
      `${this.PREFIX}${session.id}`,
      JSON.stringify(this.mapToStorage(session)),
      ttl,
    );

    // Save email index if provided
    if (session.email) {
      await this.redisService.set(
        `${this.EMAIL_INDEX}${session.email}`,
        session.id,
        ttl,
      );
    }

    // Save phone index if provided
    if (session.phone) {
      await this.redisService.set(
        `${this.PHONE_INDEX}${session.phone}`,
        session.id,
        ttl,
      );
    }

    return session;
  }

  async delete(id: string): Promise<boolean> {
    const session = await this.findById(id);
    if (!session) return false;

    await this.redisService.del(`${this.PREFIX}${id}`);

    if (session.email) {
      await this.redisService.del(`${this.EMAIL_INDEX}${session.email}`);
    }

    if (session.phone) {
      await this.redisService.del(`${this.PHONE_INDEX}${session.phone}`);
    }

    return true;
  }

  private mapToStorage(session: OtpSessionEntity): any {
    return {
      id: session.id,
      userId: session.userId,
      email: session.email,
      phone: session.phone,
      otp: session.otp,
      flowType: session.flowType,
      channelsSent: session.channelsSent,
      status: session.status,
      attemptCount: session.attemptCount,
      maxAttempts: session.maxAttempts,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      verifiedAt: session.verifiedAt?.toISOString(),
      deviceId: session.deviceId,
    };
  }

  private mapToEntity(data: any): OtpSessionEntity {
    return new OtpSessionEntity({
      id: data.id,
      userId: data.userId,
      email: data.email,
      phone: data.phone,
      otp: data.otp,
      flowType: data.flowType,
      channelsSent: data.channelsSent,
      status: data.status,
      attemptCount: data.attemptCount,
      maxAttempts: data.maxAttempts,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
      verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
      deviceId: data.deviceId,
    });
  }
}
