import { OtpSessionEntity } from '../entities/otp-session.entity';

export interface IOtpSessionRepository {
  findById(id: string): Promise<OtpSessionEntity | null>;
  findByEmail(email: string): Promise<OtpSessionEntity | null>;
  findByPhone(phone: string): Promise<OtpSessionEntity | null>;
  save(session: OtpSessionEntity): Promise<OtpSessionEntity>;
  delete(id: string): Promise<boolean>;
}
