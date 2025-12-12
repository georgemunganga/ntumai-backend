export type FlowType = 'login' | 'signup';
export type OtpChannel = 'sms' | 'email';
export type OtpSessionStatus = 'active' | 'verified' | 'expired' | 'locked';

export class OtpSessionEntity {
  id: string;
  userId?: string; // null for new users
  email?: string;
  phone?: string;
  otp: string;
  flowType: FlowType;
  channelsSent: OtpChannel[];
  status: OtpSessionStatus;
  attemptCount: number;
  maxAttempts: number = 5;
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
  deviceId?: string;

  constructor(data: Partial<OtpSessionEntity>) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;
    this.email = data.email;
    this.phone = data.phone;
    this.otp = data.otp || '';
    this.flowType = data.flowType || 'signup';
    this.channelsSent = data.channelsSent || [];
    this.status = data.status || 'active';
    this.attemptCount = data.attemptCount || 0;
    this.maxAttempts = data.maxAttempts || 5;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.verifiedAt = data.verifiedAt;
    this.deviceId = data.deviceId;
  }

  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isLocked(): boolean {
    return this.status === 'locked' || this.attemptCount >= this.maxAttempts;
  }

  incrementAttempt(): void {
    this.attemptCount++;
    if (this.attemptCount >= this.maxAttempts) {
      this.status = 'locked';
    }
  }

  verify(): void {
    this.status = 'verified';
    this.verifiedAt = new Date();
  }

  lock(): void {
    this.status = 'locked';
  }

  getTimeRemaining(): number {
    const remaining = this.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // seconds
  }
}
