export interface RefreshTokenProps {
  id: string;
  tokenHash: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
}

export class RefreshTokenEntity {
  private props: RefreshTokenProps;

  constructor(props: RefreshTokenProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get userId(): string {
    return this.props.userId;
  }

  get deviceId(): string | undefined {
    return this.props.deviceId;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  revoke(): void {
    this.props.isRevoked = true;
    this.props.revokedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      deviceId: this.deviceId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      expiresAt: this.expiresAt,
      isRevoked: this.isRevoked,
      revokedAt: this.revokedAt,
      createdAt: this.createdAt,
    };
  }
}
