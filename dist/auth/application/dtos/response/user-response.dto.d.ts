import { UserRole } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class TokensResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export declare class OtpRequestResponseDto {
    challengeId: string;
    expiresAt: Date;
    resendAvailableAt: Date;
    attemptsAllowed: number;
}
export declare class OtpVerifyExistingUserResponseDto {
    user: UserResponseDto;
    tokens: TokensResponseDto;
}
export declare class OtpVerifyNewUserResponseDto {
    registrationToken: string;
    expiresIn: number;
}
export declare class RegisterResponseDto {
    user: UserResponseDto;
    tokens: TokensResponseDto;
}
