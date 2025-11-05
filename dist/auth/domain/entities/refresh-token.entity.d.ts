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
export declare class RefreshTokenEntity {
    private props;
    constructor(props: RefreshTokenProps);
    get id(): string;
    get tokenHash(): string;
    get userId(): string;
    get deviceId(): string | undefined;
    get ipAddress(): string | undefined;
    get userAgent(): string | undefined;
    get expiresAt(): Date;
    get isRevoked(): boolean;
    get revokedAt(): Date | undefined;
    get createdAt(): Date;
    isExpired(): boolean;
    isValid(): boolean;
    revoke(): void;
    toJSON(): {
        id: string;
        userId: string;
        deviceId: string | undefined;
        ipAddress: string | undefined;
        userAgent: string | undefined;
        expiresAt: Date;
        isRevoked: boolean;
        revokedAt: Date | undefined;
        createdAt: Date;
    };
}
