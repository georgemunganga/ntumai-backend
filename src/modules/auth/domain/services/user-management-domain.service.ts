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

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface PasswordStrengthResult {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isAcceptable: boolean;
}

/**
 * Consolidated domain service that handles user authentication, registration,
 * password management, and security policies in a cohesive manner.
 */
@Injectable()
export class UserManagementDomainService {
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDurationMinutes = 15;
  private readonly minPasswordAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly passwordHistoryLimit = 5;
  private readonly resetTokenValidityMinutes = 30;
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }>();

  // === AUTHENTICATION METHODS ===

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

    // Validate password strength
    const strengthResult = this.analyzePasswordStrength(userData.password);
    if (!strengthResult.isAcceptable) {
      throw new BadRequestException(`Password is too weak: ${strengthResult.feedback.join(', ')}`);
    }

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

  // === PASSWORD MANAGEMENT METHODS ===

  async validatePasswordChange(user: User, newPlainPassword: string, currentPlainPassword?: string): Promise<void> {
    // If current password is provided, validate it
    if (currentPlainPassword) {
      const isCurrentPasswordValid = await user.validatePassword(currentPlainPassword);
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Check password strength
    const strengthResult = this.analyzePasswordStrength(newPlainPassword);
    if (!strengthResult.isAcceptable) {
      throw new BadRequestException(`Password is too weak: ${strengthResult.feedback.join(', ')}`);
    }

    // Check if new password is same as current
    const isSameAsCurrent = await user.validatePassword(newPlainPassword);
    if (isSameAsCurrent) {
      throw new BadRequestException('New password must be different from current password');
    }

    // In a real implementation, you would check password history
    // await this.validatePasswordHistory(user.id, newPlainPassword);
  }

  analyzePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 12) {
      score += 1;
    } else if (password.length >= 8) {
      score += 0.5;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Character variety checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    
    if (varietyCount >= 4) {
      score += 1.5;
    } else if (varietyCount >= 3) {
      score += 1;
    } else if (varietyCount >= 2) {
      score += 0.5;
    } else {
      feedback.push('Password should include uppercase, lowercase, numbers, and special characters');
    }

    // Common patterns check
    if (this.hasCommonPatterns(password)) {
      score -= 0.5;
      feedback.push('Avoid common patterns like 123, abc, or qwerty');
    }

    // Dictionary words check (simplified)
    if (this.containsCommonWords(password)) {
      score -= 0.5;
      feedback.push('Avoid using common dictionary words');
    }

    // Repetitive characters check
    if (this.hasRepetitiveCharacters(password)) {
      score -= 0.5;
      feedback.push('Avoid repetitive characters');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(4, score));

    return {
      score: Math.round(score * 2) / 2, // Round to nearest 0.5
      feedback,
      isAcceptable: score >= 2.0 && feedback.length === 0
    };
  }

  // === TOKEN AND SECURITY METHODS ===

  generateResetToken(userId: string): PasswordResetToken {
    const token = this.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + this.resetTokenValidityMinutes * 60 * 1000);

    return {
      token,
      userId,
      expiresAt,
      isUsed: false,
      createdAt: new Date(),
    };
  }

  validateResetToken(resetToken: PasswordResetToken): void {
    if (resetToken.isUsed) {
      throw new BadRequestException('Password reset token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Password reset token has expired');
    }
  }

  validatePasswordResetEligibility(user: User): void {
    if (!user.isActive) {
      throw new BadRequestException('Cannot reset password for deactivated account');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Email must be verified before password reset');
    }
  }

  async generateTemporaryPassword(): Promise<{ plainPassword: string; hashedPassword: Password }> {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';
    
    // Ensure at least one of each character type
    tempPassword += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); // Uppercase
    tempPassword += this.getRandomChar('abcdefghijklmnopqrstuvwxyz'); // Lowercase
    tempPassword += this.getRandomChar('0123456789'); // Number
    tempPassword += this.getRandomChar('!@#$%^&*'); // Special
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      tempPassword += this.getRandomChar(chars);
    }
    
    // Shuffle the password
    tempPassword = tempPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    const hashedPassword = await Password.create(tempPassword);
    
    return {
      plainPassword: tempPassword,
      hashedPassword
    };
  }

  // === AUTHORIZATION AND ROLE METHODS ===

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
    if (!currentUser.currentRole.isAdmin()) {
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

  shouldForcePasswordChange(user: User): boolean {
    // Force password change for new users
    if (!user.lastLoginAt) {
      return false; // First login, don't force change immediately
    }

    // Force password change after certain period (e.g., 90 days)
    const passwordMaxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const passwordAge = Date.now() - user.updatedAt.getTime();
    
    return passwordAge > passwordMaxAge;
  }

  // === UTILITY METHODS ===

  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
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

  // === PRIVATE HELPER METHODS ===

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
    return user.currentRole.isAdmin() && user.email.value === 'superadmin@company.com';
  }

  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
      /admin/i,
      /(..)\1{2,}/, // Three or more repeated characters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  private containsCommonWords(password: string): boolean {
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome',
      'hello', 'world', 'test', 'demo', 'sample'
    ];

    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => lowerPassword.includes(word));
  }

  private hasRepetitiveCharacters(password: string): boolean {
    // Check for more than 2 consecutive identical characters
    return /(..)\1{2,}/.test(password);
  }

  private getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // In a real implementation, you would store and check password history
  private async validatePasswordHistory(userId: string, newPlainPassword: string): Promise<void> {
    // This would query the password history from the repository
    // and compare against the last N passwords
    // throw new BadRequestException('Cannot reuse any of the last 5 passwords');
  }
}