import { UserRole } from '@prisma/client';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import { Password } from '../value-objects/password.vo';
export interface UserProps {
    id: string;
    email?: Email;
    phone?: Phone;
    firstName: string;
    lastName: string;
    password: Password;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserEntity {
    private props;
    constructor(props: UserProps);
    get id(): string;
    get email(): Email | undefined;
    get phone(): Phone | undefined;
    get firstName(): string;
    get lastName(): string;
    get fullName(): string;
    get password(): Password;
    get role(): UserRole;
    get isEmailVerified(): boolean;
    get isPhoneVerified(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    verifyEmail(): void;
    verifyPhone(): void;
    updatePassword(newPassword: Password): void;
    updateProfile(firstName: string, lastName: string): void;
    verifyPassword(plainPassword: string): Promise<boolean>;
    toJSON(): {
        id: string;
        email: string | undefined;
        phone: string | undefined;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
}
