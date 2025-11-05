import { UserRole } from '@prisma/client';
export declare class UserProfileResponseDto {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    currentRole: UserRole;
    roles: UserRole[];
    profileComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RoleInfoDto {
    role: UserRole;
    active: boolean;
}
export declare class UserRolesResponseDto {
    currentRole: UserRole;
    roles: RoleInfoDto[];
}
export declare class AddressResponseDto {
    id: string;
    type: string;
    label?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    instructions?: string;
    contactName?: string;
    contactPhone?: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class DeviceResponseDto {
    deviceId: string;
    platform: string;
    lastSeen: Date;
}
