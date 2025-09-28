<<<<<<< HEAD
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
=======
import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { OtpSecurityAdapter } from '../auth/application/services';
import { VerifyOtpCommand } from '../auth/application/use-cases';
>>>>>>> main
import { SwitchRoleDto } from './dto';
import { AddAddressDto, ChangePasswordDto, UpdateProfileDto } from '../auth/dto';
import { AddressType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

<<<<<<< HEAD
  async switchRole(userId: string, switchRoleDto: SwitchRoleDto) {
    const { targetRole, otpCode, phoneNumber, email } = switchRoleDto;

=======
  async getProfile(userId: string) {
>>>>>>> main
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

<<<<<<< HEAD
    let prismaRole: UserRole;
    switch (targetRole.toLowerCase()) {
      case 'customer':
        prismaRole = UserRole.CUSTOMER;
        break;
      case 'rider':
      case 'driver':
        prismaRole = UserRole.DRIVER;
        break;
      case 'vendor':
        prismaRole = UserRole.VENDOR;
        break;
      default:
        throw new BadRequestException('Invalid target role');
    }

    const hasRole = user.userRoles.some(ur => ur.role === prismaRole && ur.isActive);

    if (!hasRole) {
      throw new BadRequestException(`You don't have access to the ${targetRole} role. Please register for this role first.`);
    }

    if (prismaRole === UserRole.DRIVER || prismaRole === UserRole.VENDOR) {
      if (!otpCode) {
        throw new BadRequestException('OTP verification is required for this role switch');
      }
    }

=======
    return {
      ...this.mapUserProfile(user),
      addresses: user.addresses.map(address => this.mapAddress(address)),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Record<string, any> = {};

    if (updateProfileDto.name) {
      const trimmedName = updateProfileDto.name.trim();
      const [firstName, ...rest] = trimmedName.split(/\s+/);
      if (firstName) {
        data.firstName = firstName;
        data.lastName = rest.join(' ') || user.lastName;
      }
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: updateProfileDto.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
      data.email = updateProfileDto.email;
    }

    if (updateProfileDto.profileImage) {
      data.profileImage = updateProfileDto.profileImage;
    }

    if (Object.keys(data).length === 0) {
      const existingProfile = await this.getProfile(userId);
      return {
        success: true,
        message: 'Profile updated successfully',
        user: existingProfile,
      };
    }

>>>>>>> main
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { addresses: true },
    });

    const profile = {
      ...this.mapUserProfile(updatedUser),
      addresses: updatedUser.addresses.map(address => this.mapAddress(address)),
    };

    return {
      success: true,
      message: 'Profile updated successfully',
      user: profile,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      throw new BadRequestException('Unsupported file upload configuration');
    }

    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: dataUrl },
    });

    if (!updatedUser.profileImage) {
      throw new BadRequestException('Failed to update profile image');
    }

    return updatedUser.profileImage;
  }

  async addAddress(userId: string, addAddressDto: AddAddressDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressType = this.parseAddressType(addAddressDto.type);

    if (addAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        type: addressType,
        address: addAddressDto.address,
        city: addAddressDto.city,
        state: addAddressDto.state,
        country: addAddressDto.country,
        postalCode: addAddressDto.postalCode,
        latitude: addAddressDto.latitude,
        longitude: addAddressDto.longitude,
        isDefault: addAddressDto.isDefault ?? false,
      },
    });

<<<<<<< HEAD
    const availableRoles = updatedUser.userRoles.map(ur => {
      switch (ur.role) {
        case UserRole.CUSTOMER:
          return 'customer';
        case UserRole.DRIVER:
          return 'rider';
        case UserRole.VENDOR:
          return 'vendor';
        case UserRole.ADMIN:
          return 'admin';
        default:
          return (ur.role as string).toLowerCase();
      }
    });
=======
    return {
      success: true,
      address: this.mapAddress(address),
    };
  }

  async switchRole(userId: string, switchRoleDto: SwitchRoleDto) {
    const result = await this.updateUserRole(userId, switchRoleDto);
>>>>>>> main

    return {
      success: true,
      message: 'Role switched successfully',
      user: result,
    };
  }

<<<<<<< HEAD
  async registerForRole(userId: string, targetRole: string, otpCode?: string, phoneNumber?: string, email?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let prismaRole: UserRole;
    switch (targetRole.toLowerCase()) {
      case 'customer':
        prismaRole = UserRole.CUSTOMER;
        break;
      case 'rider':
      case 'driver':
        prismaRole = UserRole.DRIVER;
        break;
      case 'vendor':
        prismaRole = UserRole.VENDOR;
        break;
      default:
        throw new BadRequestException('Invalid target role');
    }

    const existingRole = user.userRoles.find(ur => ur.role === prismaRole);
    if (existingRole && existingRole.isActive) {
      throw new BadRequestException(`You already have access to the ${targetRole} role`);
    }

    if (prismaRole === UserRole.DRIVER || prismaRole === UserRole.VENDOR) {
      if (!otpCode) {
        throw new BadRequestException('OTP verification is required for this role registration');
      }
    }

    if (existingRole) {
      await this.prisma.userRole_Assignment.update({
        where: { id: existingRole.id },
        data: { isActive: true },
      });
    } else {
      await this.prisma.userRole_Assignment.create({
        data: {
          userId: user.id,
          role: prismaRole,
          isActive: true,
        },
      });
    }

=======
  async registerForRole(userId: string, switchRoleDto: SwitchRoleDto) {
    const result = await this.updateUserRole(userId, switchRoleDto);
>>>>>>> main
    return {
      success: true,
      message: `Successfully registered for ${result.currentRole} role`,
      role: result.currentRole,
    };
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

<<<<<<< HEAD
    const availableRoles = user.userRoles.map(ur => {
      switch (ur.role) {
        case UserRole.CUSTOMER:
          return 'customer';
        case UserRole.DRIVER:
          return 'rider';
        case UserRole.VENDOR:
          return 'vendor';
        case UserRole.ADMIN:
          return 'admin';
        default:
          return (ur.role as string).toLowerCase();
      }
    });

    let currentRole = 'customer';
    switch (user.currentRole) {
      case UserRole.CUSTOMER:
        currentRole = 'customer';
        break;
      case UserRole.DRIVER:
        currentRole = 'rider';
        break;
      case UserRole.VENDOR:
        currentRole = 'vendor';
        break;
      case UserRole.ADMIN:
        currentRole = 'admin';
        break;
      default:
        currentRole = (user.currentRole as string).toLowerCase();
    }
=======
    const currentRoleLabel = this.roleToLabel(user.role);
    const availableRoles = Object.values(UserRole).map(role => this.roleToLabel(role));
>>>>>>> main

    return {
      success: true,
      user: {
        id: user.id,
        name: this.buildFullName(user.firstName, user.lastName),
        phoneNumber: user.phone,
        email: user.email,
        currentRole: currentRoleLabel,
        availableRoles,
      },
    };
  }
<<<<<<< HEAD
=======

  private async updateUserRole(userId: string, switchRoleDto: SwitchRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetRole = this.parseTargetRole(switchRoleDto.targetRole);
    const targetRoleLabel = this.roleToLabel(targetRole);

    if (user.role === targetRole) {
      throw new BadRequestException(`You already have the ${targetRoleLabel} role`);
    }

    if (this.requiresOtp(targetRole)) {
      await this.verifyOtpForRoleChange(user, switchRoleDto);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
    });

    return {
      id: updatedUser.id,
      name: this.buildFullName(updatedUser.firstName, updatedUser.lastName),
      phoneNumber: updatedUser.phone,
      email: updatedUser.email,
      userType: targetRoleLabel,
      availableRoles: Object.values(UserRole).map(role => this.roleToLabel(role)),
      currentRole: targetRoleLabel,
      updatedAt: updatedUser.updatedAt.toISOString(),
    };
  }

  private parseTargetRole(targetRole: string): UserRole {
    const normalized = targetRole.trim().toLowerCase();
    switch (normalized) {
      case 'customer':
        return UserRole.CUSTOMER;
      case 'driver':
      case 'rider':
        return UserRole.DRIVER;
      case 'vendor':
        return UserRole.VENDOR;
      case 'admin':
        return UserRole.ADMIN;
      default:
        throw new BadRequestException('Invalid target role');
    }
  }

  private roleToLabel(role: UserRole): string {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'customer';
      case UserRole.DRIVER:
        return 'driver';
      case UserRole.VENDOR:
        return 'vendor';
      case UserRole.ADMIN:
        return 'admin';
      default:
        return role.toLowerCase();
    }
  }

  private requiresOtp(role: UserRole): boolean {
    return role === UserRole.DRIVER || role === UserRole.VENDOR;
  }

  private async verifyOtpForRoleChange(user: any, switchRoleDto: SwitchRoleDto) {
    if (!switchRoleDto.otpCode) {
      throw new BadRequestException('OTP verification is required for this role change');
    }

    const identifierEmail = switchRoleDto.email ?? user.email;
    const identifierPhone = switchRoleDto.phoneNumber ?? user.phone;

    if (!identifierEmail && !identifierPhone) {
      throw new BadRequestException('Phone number or email is required for OTP verification');
    }

    if (!switchRoleDto.requestId) {
      throw new BadRequestException('OTP requestId is required for verification');
    }

    const verification = await this.otpManagementService.verifyOtp({
      otp: switchRoleDto.otpCode,
      phoneNumber: identifierPhone ?? undefined,
      email: identifierEmail ?? undefined,
      requestId: switchRoleDto.requestId,
    } as VerifyOtpCommand);

    if (!verification.success) {
      throw new BadRequestException('Invalid or expired OTP');
    }
  }

  private parseAddressType(type: string): AddressType {
    const normalized = type.trim().toLowerCase();
    switch (normalized) {
      case 'home':
        return AddressType.HOME;
      case 'work':
        return AddressType.WORK;
      case 'other':
        return AddressType.OTHER;
      default:
        throw new BadRequestException('Invalid address type');
    }
  }

  private mapAddress(address: any) {
    return {
      id: address.id,
      type: this.addressTypeToLabel(address.type),
      address: address.address,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: address.isDefault,
      createdAt: address.createdAt?.toISOString?.() ?? undefined,
      updatedAt: address.updatedAt?.toISOString?.() ?? undefined,
    };
  }

  private addressTypeToLabel(type: AddressType): string {
    switch (type) {
      case AddressType.HOME:
        return 'home';
      case AddressType.WORK:
        return 'work';
      case AddressType.OTHER:
        return 'other';
      default:
        return type.toLowerCase();
    }
  }

  private mapUserProfile(user: any) {
    return {
      id: user.id,
      name: this.buildFullName(user.firstName, user.lastName),
      phoneNumber: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      userType: this.roleToLabel(user.role),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private buildFullName(firstName?: string, lastName?: string): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }
>>>>>>> main
}
