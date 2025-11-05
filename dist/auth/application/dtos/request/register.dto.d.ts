import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    registrationToken?: string;
    firstName: string;
    lastName: string;
    password: string;
    role: UserRole;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
}
