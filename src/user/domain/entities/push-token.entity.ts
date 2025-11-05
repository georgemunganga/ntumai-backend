export interface PushTokenProps {
  id: string;
  userId: string;
  deviceId: string;
  platform: string;
  pushToken: string;
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PushTokenEntity {
  private constructor(private readonly props: PushTokenProps) {}

  static create(
    userId: string,
    deviceId: string,
    platform: string,
    pushToken: string,
  ): PushTokenEntity {
    return new PushTokenEntity({
      id: crypto.randomUUID(),
      userId,
      deviceId,
      platform,
      pushToken,
      isActive: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: PushTokenProps): PushTokenEntity {
    return new PushTokenEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get deviceId(): string {
    return this.props.deviceId;
  }

  get platform(): string {
    return this.props.platform;
  }

  get pushToken(): string {
    return this.props.pushToken;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastSeen(): Date {
    return this.props.lastSeen;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateLastSeen(): void {
    this.props.lastSeen = new Date();
    this.props.updatedAt = new Date();
  }

  updateToken(pushToken: string): void {
    this.props.pushToken = pushToken;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  toPersistence(): PushTokenProps {
    return { ...this.props };
  }
}
