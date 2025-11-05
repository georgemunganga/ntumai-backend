import { IdentifierType, OtpPurpose } from '@prisma/client';
import { OtpCode } from '../value-objects/otp-code.vo';
export interface OtpChallengeProps {
    id: string;
    challengeId: string;
    identifier: string;
    identifierType: IdentifierType;
    otpCodeHash: string;
    purpose: OtpPurpose;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    resendAvailableAt: Date;
    isVerified: boolean;
    verifiedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export declare class OtpChallengeEntity {
    private props;
    constructor(props: OtpChallengeProps);
    get id(): string;
    get challengeId(): string;
    get identifier(): string;
    get identifierType(): IdentifierType;
    get otpCodeHash(): string;
    get purpose(): OtpPurpose;
    get attempts(): number;
    get maxAttempts(): number;
    get expiresAt(): Date;
    get resendAvailableAt(): Date;
    get isVerified(): boolean;
    get verifiedAt(): Date | undefined;
    get ipAddress(): string | undefined;
    get userAgent(): string | undefined;
    get createdAt(): Date;
    isExpired(): boolean;
    canResend(): boolean;
    hasAttemptsLeft(): boolean;
    incrementAttempts(): void;
    verify(otpCode: OtpCode): Promise<boolean>;
    markAsVerified(): void;
    toJSON(): {
        id: string;
        challengeId: string;
        identifier: string;
        identifierType: import("@prisma/client").$Enums.IdentifierType;
        purpose: import("@prisma/client").$Enums.OtpPurpose;
        attempts: number;
        maxAttempts: number;
        expiresAt: Date;
        resendAvailableAt: Date;
        isVerified: boolean;
        verifiedAt: Date | undefined;
        createdAt: Date;
    };
}
