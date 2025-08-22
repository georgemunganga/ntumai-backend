import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Email, Password, UserRole, Phone } from '../value-objects';
import { DomainEvent } from '../events';

export interface AuthenticationResult {
  user: User;
  isNewUser: boolean;
}

export interface LoginAttempt {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthenticationDomainService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDurationMinutes = 15;
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();

  async authenticateUser(user: User, plainPassword: string, loginAttempt?: Partial<LoginAttempt>): Promise<User> {
    // Check if account is locked
    this.checkAccountLockout(user.email.value);

    // Check if user is active
    if (!user.isActive) {
      this.recordFailedAttempt(user.email.value);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(plainPassword);
    if (!isPasswordValid) {
      this.recordFailedAttempt(user.email.value);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear failed attempts on successful login
    this.clearFailedAttempts(user.email.value);

    // Record successful login
    user.recordLogin();

    return user;
  }

  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }): Promise<User> {
    // Create value objects
    const email = Email.create(userData.email);
    const password = await Password.create(userData.password);
    const role = userData.role ? UserRole.create(userData.role) : UserRole.customer();
    const phone = userData.phone ? Phone.create(userData.phone) : undefined;

    // Business rules for registration
    this.validateRegistrationRules(email, role);

    // Create user entity
    const user = await User.create({
      email,
      password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone,
      role,
    });

    return user;
  }

  validatePasswordResetEligibility(user: User): void {
    if (!user.isActive) {
      throw new BadRequestException('Cannot reset password for deactivated account');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Email must be verified before password reset');
    }
  }

  validateTokenRefreshEligibility(user: User, refreshToken: string): void {
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.hasRefreshToken(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  validateRoleChange(currentUser: User, targetUser: User, newRole: UserRole): void {
    // Only admins can change roles
    if (!currentUser.role.isAdmin()) {
      throw new UnauthorizedException('Only administrators can change user roles');
    }

    // Cannot change own role
    if (currentUser.equals(targetUser)) {
      throw new BadRequestException('Cannot change your own role');
    }

    // Cannot promote to admin unless super admin (business rule)
    if (newRole.isAdmin() && !this.isSuperAdmin(currentUser)) {
      throw new UnauthorizedException('Insufficient privileges to assign admin role');
    }
  }

  generateSecureToken(): string {
    // In production, use crypto.randomBytes or similar
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  calculateTokenExpiry(durationMinutes: number = 60): Date {
    return new Date(Date.now() + durationMinutes * 60 * 1000);
  }

  isTokenExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }

  // Private helper methods
  private validateRegistrationRules(email: Email, role: UserRole): void {
    // Business rule: Only one admin account allowed per email domain for certain domains
    if (role.isAdmin()) {
      const emailDomain = email.value.split('@')[1];
      const restrictedDomains = ['company.com', 'admin.com']; // Configure as needed
      
      if (restrictedDomains.includes(emailDomain)) {
        // In a real implementation, you'd check the repository
        // throw new BadRequestException('Admin account already exists for this domain');
      }
    }

    // Business rule: Vendor accounts require additional validation
    if (role.isVendor()) {
      // Additional vendor-specific validation could go here
    }
  }

  private checkAccountLockout(email: string): void {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return;

    if (attempts.lockedUntil && new Date() < attempts.lockedUntil) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(`Account locked. Try again in ${remainingMinutes} minutes.`);
    }

    // Clear expired lockout
    if (attempts.lockedUntil && new Date() >= attempts.lockedUntil) {
      this.loginAttempts.delete(email);
    }
  }

  private recordFailedAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();

    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockedUntil = new Date(Date.now() + this.lockoutDurationMinutes * 60 * 1000);
    }

    this.loginAttempts.set(email, attempts);
  }

  private clearFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  private isSuperAdmin(user: User): boolean {
    // Business logic to determine if user is super admin
    // This could be based on a special flag, specific email, etc.
    return user.role.isAdmin() && user.email.value === 'superadmin@company.com';
  }
}