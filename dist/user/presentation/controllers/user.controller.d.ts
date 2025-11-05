import { UserService } from '../../application/services/user.service';
import { UpdateProfileDto, ChangePasswordDto, UploadProfileImageDto } from '../../application/dtos/request/update-profile.dto';
import { SwitchRoleDto, RegisterRoleDto } from '../../application/dtos/request/role-management.dto';
import { CreateAddressDto, UpdateAddressDto } from '../../application/dtos/request/address.dto';
import { RegisterPushTokenDto } from '../../application/dtos/request/device.dto';
import { UserProfileResponseDto, UserRolesResponseDto, AddressResponseDto, DeviceResponseDto } from '../../application/dtos/response/user-profile.response.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getProfile(req: any): Promise<UserProfileResponseDto>;
    updateProfile(req: any, dto: UpdateProfileDto): Promise<UserProfileResponseDto>;
    getRoles(req: any): Promise<UserRolesResponseDto>;
    switchRole(req: any, dto: SwitchRoleDto): Promise<{
        currentRole: import("@prisma/client").UserRole;
    }>;
    registerRole(req: any, dto: RegisterRoleDto): Promise<{
        role: import("@prisma/client").UserRole;
        active: boolean;
    }>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadProfileImage(req: any, dto: UploadProfileImageDto, file?: Express.Multer.File): Promise<{
        imageUrl: string;
    }>;
    createAddress(req: any, dto: CreateAddressDto): Promise<{
        success: boolean;
        data: {
            address: AddressResponseDto;
        };
    }>;
    updateAddress(req: any, addressId: string, dto: UpdateAddressDto): Promise<{
        success: boolean;
        message: string;
        data: {
            address: AddressResponseDto;
        };
    }>;
    deleteAddress(req: any, addressId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAddresses(req: any): Promise<{
        success: boolean;
        data: {
            addresses: AddressResponseDto[];
        };
    }>;
    setDefaultAddress(req: any, addressId: string): Promise<{
        success: boolean;
        data: {
            defaultAddressId: string;
        };
    }>;
    getDefaultAddress(req: any): Promise<{
        success: boolean;
        data: {
            address: AddressResponseDto;
        };
    }>;
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<{
        success: boolean;
        data: {
            deviceId: string;
        };
    }>;
    getDevices(req: any): Promise<{
        success: boolean;
        data: {
            devices: DeviceResponseDto[];
        };
    }>;
    deleteDevice(req: any, deviceId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPreferences(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    updatePreferences(req: any, preferences: any): Promise<{
        success: boolean;
        data: any;
    }>;
}
