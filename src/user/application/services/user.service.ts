import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
} from '../dtos/request/update-profile.dto';
import {
  SwitchRoleDto,
  RegisterRoleDto,
} from '../dtos/request/role-management.dto';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../dtos/request/address.dto';
import { RegisterPushTokenDto } from '../dtos/request/device.dto';
import {
  UserProfileResponseDto,
  UserRolesResponseDto,
  AddressResponseDto,
  DeviceResponseDto,
  RoleInfoDto,
} from '../dtos/response/user-profile.response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserRoleAssignment: {
          where: { active: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.UserRoleAssignment.map((ra) => ra.role);
    const profileComplete = !!(
      user.firstName &&
      user.lastName &&
      (user.email || user.phone)
    );

    return {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage || undefined,
      currentRole: user.role,
      roles: roles.length > 0 ? roles : [user.role],
      profileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const updateData: any = {};

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.avatarUrl) updateData.profileImage = dto.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        UserRoleAssignment: {
          where: { active: true },
        },
      },
    });

    const roles = user.UserRoleAssignment.map((ra) => ra.role);
    const profileComplete = !!(
      user.firstName &&
      user.lastName &&
      (user.email || user.phone)
    );

    return {
      id: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage || undefined,
      currentRole: user.role,
      roles: roles.length > 0 ? roles : [user.role],
      profileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserRoles(userId: string): Promise<UserRolesResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserRoleAssignment: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all possible roles
    const allRoles = Object.values(UserRole);
    const roleAssignments = user.UserRoleAssignment;

    const roles: RoleInfoDto[] = allRoles.map((role) => {
      const assignment = roleAssignments.find((ra) => ra.role === role);
      return {
        role,
        active: assignment ? assignment.active : false,
      };
    });

    return {
      currentRole: user.role,
      roles,
    };
  }

  async switchRole(
    userId: string,
    dto: SwitchRoleDto,
  ): Promise<{ currentRole: UserRole }> {
    // Check if user has this role assigned and active
    const roleAssignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: dto.targetRole,
        },
      },
    });

    if (!roleAssignment) {
      throw new ConflictException('Role not registered');
    }

    if (!roleAssignment.active) {
      throw new BadRequestException('Role is not active');
    }

    // For VENDOR and DRIVER roles, verify OTP if provided
    if (
      (dto.targetRole === 'VENDOR' || dto.targetRole === 'DRIVER') &&
      dto.otpCode
    ) {
      // TODO: Implement OTP verification logic here
      // For now, we'll skip this validation
    }

    // Update user's current role
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.targetRole,
        updatedAt: new Date(),
      },
    });

    return { currentRole: dto.targetRole };
  }

  async registerRole(
    userId: string,
    dto: RegisterRoleDto,
  ): Promise<{ role: UserRole; active: boolean }> {
    // Check if role already exists
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role: dto.role,
        },
      },
    });

    if (existing && existing.active) {
      throw new ConflictException('Role already active');
    }

    // For VENDOR and DRIVER, require OTP verification
    if ((dto.role === 'VENDOR' || dto.role === 'DRIVER') && !dto.otpCode) {
      throw new BadRequestException('OTP verification required for this role');
    }

    // TODO: Verify OTP if provided

    // Create or reactivate role assignment
    const roleAssignment = await this.prisma.userRoleAssignment.upsert({
      where: {
        userId_role: {
          userId,
          role: dto.role,
        },
      },
      create: {
        userId,
        role: dto.role,
        active: true,
        metadata: dto.metadata || {},
      },
      update: {
        active: true,
        metadata: dto.metadata || {},
        updatedAt: new Date(),
      },
    });

    return {
      role: roleAssignment.role,
      active: roleAssignment.active,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  async uploadProfileImage(
    userId: string,
    imageUrl: string,
  ): Promise<{ imageUrl: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
        updatedAt: new Date(),
      },
    });

    return { imageUrl };
  }

  // Address Management
  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false, updatedAt: new Date() },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        type: dto.type,
        label: dto.label,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        instructions: dto.instructions,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        isDefault: dto.isDefault || false,
        updatedAt: new Date(),
      },
    });

    return this.mapAddressToDto(address);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    // Verify ownership
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false, updatedAt: new Date() },
      });
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return this.mapAddressToDto(address);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((addr) => this.mapAddressToDto(addr));
  }

  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<{ defaultAddressId: string }> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Unset other defaults and set this one
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false, updatedAt: new Date() },
      }),
      this.prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true, updatedAt: new Date() },
      }),
    ]);

    return { defaultAddressId: addressId };
  }

  async getDefaultAddress(userId: string): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });

    if (!address) {
      throw new NotFoundException(
        'No default address set',
        'USERS/DEFAULT_ADDRESS_NOT_SET',
      );
    }

    return this.mapAddressToDto(address);
  }

  // Device Management
  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<{ deviceId: string }> {
    await this.prisma.pushToken.upsert({
      where: {
        userId_deviceId: {
          userId,
          deviceId: dto.deviceId,
        },
      },
      create: {
        userId,
        deviceId: dto.deviceId,
        platform: dto.platform,
        pushToken: dto.pushToken,
        isActive: true,
        lastSeen: new Date(),
      },
      update: {
        pushToken: dto.pushToken,
        platform: dto.platform,
        isActive: true,
        lastSeen: new Date(),
        updatedAt: new Date(),
      },
    });

    return { deviceId: dto.deviceId };
  }

  async getDevices(userId: string): Promise<DeviceResponseDto[]> {
    const devices = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSeen: 'desc' },
    });

    return devices.map((device) => ({
      deviceId: device.deviceId,
      platform: device.platform,
      lastSeen: device.lastSeen,
    }));
  }

  async deleteDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.pushToken.findFirst({
      where: { userId, deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found', 'USERS/DEVICE_NOT_FOUND');
    }

    await this.prisma.pushToken.delete({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });
  }

  // Preferences
  async getPreferences(userId: string): Promise<any> {
    const prefs = await this.prisma.userPreference.findUnique({
      where: { userId },
    });

    return (
      prefs?.preferences || {
        notifications: { orderUpdates: true, promotions: false },
      }
    );
  }

  async updatePreferences(userId: string, preferences: any): Promise<any> {
    const updated = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        preferences,
      },
      update: {
        preferences,
        updatedAt: new Date(),
      },
    });

    return updated.preferences;
  }

  private mapAddressToDto(address: any): AddressResponseDto {
    return {
      id: address.id,
      type: address.type,
      label: address.label,
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      instructions: address.instructions,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
