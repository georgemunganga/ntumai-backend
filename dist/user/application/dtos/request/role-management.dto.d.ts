import { UserRole } from '@prisma/client';
export declare class SwitchRoleDto {
    targetRole: UserRole;
    otpCode?: string;
    phoneNumber?: string;
    email?: string;
}
export declare class RegisterRoleDto {
    role: UserRole;
    otpCode?: string;
    challengeId?: string;
    metadata?: Record<string, any>;
}
