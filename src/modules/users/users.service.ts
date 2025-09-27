import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { OtpSecurityAdapter } from '../auth/application/services';
import { VerifyOtpCommand } from '../auth/application/use-cases';
import { SwitchRoleDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpManagementService: OtpSecurityAdapter,
  ) {}

  async switchRole(userId: string, switchRoleDto: SwitchRoleDto) {
    const { targetRole, otpCode, phoneNumber, email } = switchRoleDto;

    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Convert targetRole to UserRole enum
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

    // Check if user already has access to this role
    const hasRole = user.userRoles.some(ur => ur.role === prismaRole && ur.isActive);
    
    if (!hasRole) {
      throw new BadRequestException(`You don't have access to the ${targetRole} role. Please register for this role first.`);
    }

    // If switching to driver or vendor role, verify OTP
    if (prismaRole === UserRole.DRIVER || prismaRole === UserRole.VENDOR) {
      if (!otpCode) {
        throw new BadRequestException('OTP verification is required for this role switch');
      }

      const identifier = phoneNumber || email || user.phone || user.email;
      if (!identifier) {
        throw new BadRequestException('Phone number or email is required for OTP verification');
      }

      // Verify OTP
      const otpResult = await this.otpManagementService.verifyOtp({
        otp: otpCode,
        phoneNumber: phoneNumber,
        email: email,
        requestId: '' // This should be stored from the initial OTP request
      } as VerifyOtpCommand);
      if (!otpResult.success) {
        throw new BadRequestException('Invalid or expired OTP');
      }
    }

    // Update user's current role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { currentRole: prismaRole },
      include: {
        userRoles: {
          where: { isActive: true },
        },
      },
    });

    // Get available roles
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

    return {
      success: true,
      message: 'Role switched successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phoneNumber: updatedUser.phone,
        email: updatedUser.email,
        userType: targetRole,
        availableRoles,
        currentRole: targetRole,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    };
  }

  async registerForRole(userId: string, targetRole: string, otpCode?: string, phoneNumber?: string, email?: string) {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Convert targetRole to UserRole enum
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

    // Check if user already has this role
    const existingRole = user.userRoles.find(ur => ur.role === prismaRole);
    if (existingRole && existingRole.isActive) {
      throw new BadRequestException(`You already have access to the ${targetRole} role`);
    }

    // For driver and vendor roles, require OTP verification
    if (prismaRole === UserRole.DRIVER || prismaRole === UserRole.VENDOR) {
      if (!otpCode) {
        throw new BadRequestException('OTP verification is required for this role registration');
      }

      const identifier = phoneNumber || email || user.phone || user.email;
      if (!identifier) {
        throw new BadRequestException('Phone number or email is required for OTP verification');
      }

      // Verify OTP
      const otpResult = await this.otpManagementService.verifyOtp({
        otp: otpCode,
        phoneNumber: phoneNumber,
        email: email,
        requestId: '' // This should be stored from the initial OTP request
      } as VerifyOtpCommand);
      if (!otpResult.success) {
        throw new BadRequestException('Invalid or expired OTP');
      }
    }

    // Grant the role to the user
    if (existingRole) {
      // Reactivate existing role
      await this.prisma.userRole_Assignment.update({
        where: { id: existingRole.id },
        data: { isActive: true },
      });
    } else {
      // Create new role assignment
      await this.prisma.userRole_Assignment.create({
        data: {
          userId: user.id,
          role: prismaRole,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      message: `Successfully registered for ${targetRole} role`,
      role: targetRole,
    };
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone,
        email: user.email,
        currentRole,
        availableRoles,
      },
    };
  }
}