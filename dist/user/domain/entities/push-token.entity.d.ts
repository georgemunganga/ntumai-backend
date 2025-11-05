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
export declare class PushTokenEntity {
    private readonly props;
    private constructor();
    static create(userId: string, deviceId: string, platform: string, pushToken: string): PushTokenEntity;
    static fromPersistence(props: PushTokenProps): PushTokenEntity;
    get id(): string;
    get userId(): string;
    get deviceId(): string;
    get platform(): string;
    get pushToken(): string;
    get isActive(): boolean;
    get lastSeen(): Date;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateLastSeen(): void;
    updateToken(pushToken: string): void;
    deactivate(): void;
    toPersistence(): PushTokenProps;
}
