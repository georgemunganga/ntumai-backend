import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../shared/database/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from '../dtos/request/update-profile.dto';
import { SwitchRoleDto, RegisterRoleDto } from '../dtos/request/role-management.dto';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/request/address.dto';
import { RegisterPushTokenDto } from '../dtos/request/device.dto';
import { UserProfileResponseDto, UserRolesResponseDto, AddressResponseDto, DeviceResponseDto } from '../dtos/response/user-profile.response.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserProfile(userId: string): Promise<UserProfileResponseDto>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileResponseDto>;
    getUserRoles(userId: string): Promise<UserRolesResponseDto>;
    switchRole(userId: string, dto: SwitchRoleDto): Promise<{
        currentRole: UserRole;
    }>;
    registerRole(userId: string, dto: RegisterRoleDto): Promise<{
        role: UserRole;
        active: boolean;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
    uploadProfileImage(userId: string, imageUrl: string): Promise<{
        imageUrl: string;
    }>;
    createAddress(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto>;
    updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<AddressResponseDto>;
    deleteAddress(userId: string, addressId: string): Promise<void>;
    getAddresses(userId: string): Promise<AddressResponseDto[]>;
    setDefaultAddress(userId: string, addressId: string): Promise<{
        defaultAddressId: string;
    }>;
    getDefaultAddress(userId: string): Promise<AddressResponseDto>;
    registerPushToken(userId: string, dto: RegisterPushTokenDto): Promise<{
        deviceId: string;
    }>;
    getDevices(userId: string): Promise<DeviceResponseDto[]>;
    deleteDevice(userId: string, deviceId: string): Promise<void>;
    getPreferences(userId: string): Promise<any>;
    updatePreferences(userId: string, preferences: any): Promise<any>;
    private mapAddressToDto;
}
