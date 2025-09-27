import { UserEntity } from '../entities/user.entity';
import { UserRepositoryInterface } from '../repositories/user.repository.interface';
import { UserRole } from '@prisma/client';

export interface RoleChangeResult {
  success: boolean;
  message: string;
  newRole?: UserRole;
  requiresVerification?: boolean;
  verificationSteps?: string[];
}

export interface RoleEligibilityCheck {
  eligible: boolean;
  reason?: string;
  requirements?: {
    name: string;
    met: boolean;
    description: string;
  }[];
}

export interface RolePermissions {
  canCreateProducts?: boolean;
  canManageOrders?: boolean;
  canAcceptDeliveries?: boolean;
  canAccessAnalytics?: boolean;
  canManageUsers?: boolean;
  canProcessPayments?: boolean;
  canManageInventory?: boolean;
  canViewReports?: boolean;
  maxOrdersPerDay?: number;
  maxDeliveryRadius?: number;
}

export class RoleManagementService {
  constructor(
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Switch user's current active role
   */
  async switchRole(userId: string, targetRole: UserRole, otpCode?: string): Promise<RoleChangeResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user has the target role
    if (!user.roles.includes(targetRole)) {
      return {
        success: false,
        message: `You don't have access to the ${targetRole} role`
      };
    }

    // Check if role switch requires OTP verification
    const requiresOTP = this.doesRoleSwitchRequireOTP(user.currentRole, targetRole);
    
    if (requiresOTP) {
      if (!otpCode) {
        return {
          success: false,
          message: 'OTP verification required for this role switch',
          requiresVerification: true,
          verificationSteps: ['Enter the OTP sent to your registered phone number']
        };
      }

      const isValidOTP = await this.validateOTP(userId, otpCode);
      if (!isValidOTP) {
        return {
          success: false,
          message: 'Invalid or expired OTP code'
        };
      }
    }

    // Check if user meets role-specific requirements
    const eligibilityCheck = await this.checkRoleEligibility(user, targetRole);
    if (!eligibilityCheck.eligible) {
      return {
        success: false,
        message: eligibilityCheck.reason || 'You are not eligible for this role',
        verificationSteps: eligibilityCheck.requirements
          ?.filter(req => !req.met)
          .map(req => req.description) || []
      };
    }

    // Perform the role switch
    const updatedUser = user.switchRole(targetRole);
    await this.userRepository.save(updatedUser);

    // Log role switch for audit
    await this.logRoleSwitch(userId, user.currentRole, targetRole);

    return {
      success: true,
      message: `Successfully switched to ${targetRole} role`,
      newRole: targetRole
    };
  }

  /**
   * Add a new role to user
   */
  async addRole(userId: string, role: UserRole, adminUserId?: string): Promise<RoleChangeResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user already has the role
    if (user.roles.includes(role)) {
      return {
        success: false,
        message: `User already has the ${role} role`
      };
    }

    // Check role addition permissions
    const canAddRole = await this.canAddRole(userId, role, adminUserId);
    if (!canAddRole.allowed) {
      return {
        success: false,
        message: canAddRole.reason || 'Not authorized to add this role'
      };
    }

    // Check role-specific requirements
    const eligibilityCheck = await this.checkRoleEligibility(user, role);
    if (!eligibilityCheck.eligible) {
      return {
        success: false,
        message: eligibilityCheck.reason || 'User does not meet role requirements',
        requiresVerification: true,
        verificationSteps: eligibilityCheck.requirements
          ?.filter(req => !req.met)
          .map(req => req.description) || []
      };
    }

    // Add the role
    const updatedUser = user.addRole(role);
    await this.userRepository.save(updatedUser);

    // Initialize role-specific data
    await this.initializeRoleData(userId, role);

    // Log role addition
    await this.logRoleAddition(userId, role, adminUserId);

    return {
      success: true,
      message: `Successfully added ${role} role`,
      newRole: role
    };
  }

  /**
   * Remove a role from user
   */
  async removeRole(userId: string, role: UserRole, adminUserId?: string): Promise<RoleChangeResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user has the role
    if (!user.roles.includes(role)) {
      return {
        success: false,
        message: `User doesn't have the ${role} role`
      };
    }

    // Prevent removing the last role
    if (user.roles.length === 1) {
      return {
        success: false,
        message: 'Cannot remove the last role from user'
      };
    }

    // Check role removal permissions
    const canRemoveRole = await this.canRemoveRole(userId, role, adminUserId);
    if (!canRemoveRole.allowed) {
      return {
        success: false,
        message: canRemoveRole.reason || 'Not authorized to remove this role'
      };
    }

    // Check for active dependencies
    const dependencies = await this.checkRoleDependencies(userId, role);
    if (dependencies.hasActiveDependencies) {
      return {
        success: false,
        message: 'Cannot remove role due to active dependencies',
        verificationSteps: dependencies.dependencies
      };
    }

    // Remove the role
    const updatedUser = user.removeRole(role);
    
    // If removing current role, switch to another available role
    if (user.currentRole === role) {
      const newCurrentRole = updatedUser.roles[0]; // Switch to first available role
      updatedUser.switchRole(newCurrentRole);
    }

    await this.userRepository.save(updatedUser);

    // Clean up role-specific data
    await this.cleanupRoleData(userId, role);

    // Log role removal
    await this.logRoleRemoval(userId, role, adminUserId);

    return {
      success: true,
      message: `Successfully removed ${role} role`
    };
  }

  /**
   * Get user's role permissions
   */
  async getRolePermissions(userId: string, role?: UserRole): Promise<RolePermissions> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const targetRole = role || user.currentRole;
    
    if (!user.roles.includes(targetRole)) {
      throw new Error(`User doesn't have the ${targetRole} role`);
    }

    return this.getPermissionsForRole(targetRole, user);
  }

  /**
   * Check if user can perform a specific action
   */
  async canPerformAction(userId: string, action: string, context?: any): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    const permissions = await this.getRolePermissions(userId);
    return this.checkActionPermission(action, permissions, context);
  }

  /**
   * Get available roles for user
   */
  async getAvailableRoles(userId: string): Promise<{
    current: UserRole;
    available: UserRole[];
    canAdd: UserRole[];
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allRoles: UserRole[] = ['CUSTOMER', 'DRIVER', 'VENDOR', 'ADMIN'];
    const canAdd = [];

    for (const role of allRoles) {
      if (!user.roles.includes(role)) {
        const eligibility = await this.checkRoleEligibility(user, role);
        if (eligibility.eligible) {
          canAdd.push(role);
        }
      }
    }

    return {
      current: user.currentRole,
      available: user.roles,
      canAdd
    };
  }

  /**
   * Get role requirements
   */
  getRoleRequirements(role: UserRole): {
    name: string;
    description: string;
    required: boolean;
    type: 'VERIFICATION' | 'DOCUMENT' | 'APPROVAL' | 'PAYMENT';
  }[] {
    const requirements = [];

    switch (role) {
      case 'DRIVER':
        requirements.push(
          {
            name: 'Email Verification',
            description: 'Verify your email address',
            required: true,
            type: 'VERIFICATION' as const
          },
          {
            name: 'Phone Verification',
            description: 'Verify your phone number',
            required: true,
            type: 'VERIFICATION' as const
          },
          {
            name: 'Driver License',
            description: 'Upload valid driver license',
            required: true,
            type: 'DOCUMENT' as const
          },
          {
            name: 'Vehicle Registration',
            description: 'Upload vehicle registration documents',
            required: true,
            type: 'DOCUMENT' as const
          },
          {
            name: 'Insurance Certificate',
            description: 'Upload valid insurance certificate',
            required: true,
            type: 'DOCUMENT' as const
          },
          {
            name: 'Background Check',
            description: 'Complete background verification',
            required: true,
            type: 'APPROVAL' as const
          }
        );
        break;

      case 'VENDOR':
        requirements.push(
          {
            name: 'Email Verification',
            description: 'Verify your email address',
            required: true,
            type: 'VERIFICATION' as const
          },
          {
            name: 'Phone Verification',
            description: 'Verify your phone number',
            required: true,
            type: 'VERIFICATION' as const
          },
          {
            name: 'Business License',
            description: 'Upload valid business license',
            required: true,
            type: 'DOCUMENT' as const
          },
          {
            name: 'Tax Certificate',
            description: 'Upload tax registration certificate',
            required: true,
            type: 'DOCUMENT' as const
          },
          {
            name: 'Bank Account Verification',
            description: 'Verify bank account for payments',
            required: true,
            type: 'VERIFICATION' as const
          },
          {
            name: 'Security Deposit',
            description: 'Pay required security deposit',
            required: false,
            type: 'PAYMENT' as const
          }
        );
        break;

      case 'CUSTOMER':
        requirements.push(
          {
            name: 'Email Verification',
            description: 'Verify your email address',
            required: true,
            type: 'VERIFICATION' as const
          }
        );
        break;

      case 'ADMIN':
        requirements.push(
          {
            name: 'Admin Approval',
            description: 'Requires approval from existing admin',
            required: true,
            type: 'APPROVAL' as const
          },
          {
            name: 'Security Clearance',
            description: 'Complete security clearance process',
            required: true,
            type: 'APPROVAL' as const
          }
        );
        break;
    }

    return requirements;
  }

  // Private helper methods
  private doesRoleSwitchRequireOTP(fromRole: UserRole, toRole: UserRole): boolean {
    // Require OTP for sensitive role switches
    const sensitiveRoles: UserRole[] = ['ADMIN', 'VENDOR'];
    return sensitiveRoles.includes(toRole) || 
           (fromRole === 'CUSTOMER' && toRole === 'DRIVER');
  }

  private async validateOTP(userId: string, otpCode: string): Promise<boolean> {
    // In a real implementation, validate OTP against stored code
    return true; // Placeholder
  }

  private async checkRoleEligibility(user: UserEntity, role: UserRole): Promise<RoleEligibilityCheck> {
    const requirements = this.getRoleRequirements(role);
    const checkResults = [];

    for (const requirement of requirements) {
      const met = await this.isRequirementMet(user, requirement);
      checkResults.push({
        name: requirement.name,
        met,
        description: requirement.description
      });
    }

    const allRequiredMet = checkResults
      .filter((_, index) => requirements[index].required)
      .every(result => result.met);

    return {
      eligible: allRequiredMet,
      reason: allRequiredMet ? undefined : 'Some requirements are not met',
      requirements: checkResults
    };
  }

  private async isRequirementMet(user: UserEntity, requirement: {
    name: string;
    type: 'VERIFICATION' | 'DOCUMENT' | 'APPROVAL' | 'PAYMENT';
  }): Promise<boolean> {
    switch (requirement.type) {
      case 'VERIFICATION':
        if (requirement.name === 'Email Verification') {
          return user.isEmailVerified;
        }
        if (requirement.name === 'Phone Verification') {
          return user.isPhoneVerified;
        }
        break;
      
      case 'DOCUMENT':
      case 'APPROVAL':
      case 'PAYMENT':
        // These would check against user's role-specific details
        // or external verification systems
        return false; // Placeholder
    }
    
    return false;
  }

  private async canAddRole(userId: string, role: UserRole, adminUserId?: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if role addition is allowed
    if (role === 'ADMIN' && !adminUserId) {
      return {
        allowed: false,
        reason: 'Admin role can only be added by another admin'
      };
    }

    // Additional business rules for role addition
    return { allowed: true };
  }

  private async canRemoveRole(userId: string, role: UserRole, adminUserId?: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if role removal is allowed
    if (role === 'ADMIN' && !adminUserId) {
      return {
        allowed: false,
        reason: 'Admin role can only be removed by another admin'
      };
    }

    return { allowed: true };
  }

  private async checkRoleDependencies(userId: string, role: UserRole): Promise<{
    hasActiveDependencies: boolean;
    dependencies: string[];
  }> {
    const dependencies: string[] = [];

    // Check for active orders, deliveries, etc.
    switch (role) {
      case 'DRIVER':
        // Check for active deliveries
        // const activeDeliveries = await this.checkActiveDeliveries(userId);
        // if (activeDeliveries > 0) {
        //   dependencies.push('Complete all active deliveries');
        // }
        break;
      
      case 'VENDOR':
        // Check for active orders, products, etc.
        // const activeOrders = await this.checkActiveVendorOrders(userId);
        // if (activeOrders > 0) {
        //   dependencies.push('Complete all pending orders');
        // }
        break;
    }

    return {
      hasActiveDependencies: dependencies.length > 0,
      dependencies
    };
  }

  private getPermissionsForRole(role: UserRole, user: UserEntity): RolePermissions {
    const basePermissions: RolePermissions = {};

    switch (role) {
      case 'ADMIN':
        return {
          canCreateProducts: true,
          canManageOrders: true,
          canAcceptDeliveries: true,
          canAccessAnalytics: true,
          canManageUsers: true,
          canProcessPayments: true,
          canManageInventory: true,
          canViewReports: true
        };

      case 'VENDOR':
        return {
          canCreateProducts: true,
          canManageOrders: true,
          canAccessAnalytics: true,
          canProcessPayments: true,
          canManageInventory: true,
          canViewReports: true
        };

      case 'DRIVER':
        return {
          canAcceptDeliveries: true,
          canViewReports: true,
          maxOrdersPerDay: 50,
          maxDeliveryRadius: 25
        };

      case 'CUSTOMER':
        return {
          canViewReports: false
        };

      default:
        return basePermissions;
    }
  }

  private checkActionPermission(action: string, permissions: RolePermissions, context?: any): boolean {
    switch (action) {
      case 'CREATE_PRODUCT':
        return permissions.canCreateProducts || false;
      case 'MANAGE_ORDERS':
        return permissions.canManageOrders || false;
      case 'ACCEPT_DELIVERY':
        return permissions.canAcceptDeliveries || false;
      case 'ACCESS_ANALYTICS':
        return permissions.canAccessAnalytics || false;
      case 'MANAGE_USERS':
        return permissions.canManageUsers || false;
      default:
        return false;
    }
  }

  private async initializeRoleData(userId: string, role: UserRole): Promise<void> {
    // Initialize role-specific data structures
    switch (role) {
      case 'DRIVER':
        // Initialize driver-specific data (vehicle info, etc.)
        break;
      case 'VENDOR':
        // Initialize vendor-specific data (business info, etc.)
        break;
    }
  }

  private async cleanupRoleData(userId: string, role: UserRole): Promise<void> {
    // Clean up role-specific data when role is removed
    switch (role) {
      case 'DRIVER':
        // Clean up driver-specific data
        break;
      case 'VENDOR':
        // Clean up vendor-specific data
        break;
    }
  }

  private async logRoleSwitch(userId: string, fromRole: UserRole, toRole: UserRole): Promise<void> {
    // Log role switch for audit purposes
    console.log(`User ${userId} switched from ${fromRole} to ${toRole}`);
  }

  private async logRoleAddition(userId: string, role: UserRole, adminUserId?: string): Promise<void> {
    // Log role addition for audit purposes
    console.log(`Role ${role} added to user ${userId}${adminUserId ? ` by admin ${adminUserId}` : ''}`);
  }

  private async logRoleRemoval(userId: string, role: UserRole, adminUserId?: string): Promise<void> {
    // Log role removal for audit purposes
    console.log(`Role ${role} removed from user ${userId}${adminUserId ? ` by admin ${adminUserId}` : ''}`);
  }
}