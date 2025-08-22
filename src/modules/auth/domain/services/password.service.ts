import { Injectable, BadRequestException } from '@nestjs/common';
import { Password } from '../value-objects';
import { User } from '../entities/user.entity';

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

@Injectable()
export class PasswordService {
  private readonly minPasswordAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly passwordHistoryLimit = 5; // Remember last 5 passwords
  private readonly resetTokenValidityMinutes = 30;

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

  shouldForcePasswordChange(user: User): boolean {
    // Force password change for new users
    if (!user.lastLoginAt) {
      return false; // First login, don't force change immediately
    }

    // Force password change if account was created with temporary password
    // This would be tracked in user metadata in a real implementation
    
    // Force password change after certain period (e.g., 90 days)
    const passwordMaxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const passwordAge = Date.now() - user.updatedAt.getTime();
    
    return passwordAge > passwordMaxAge;
  }

  // Private helper methods
  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
      /admin/i,
      /(.)\1{2,}/, // Three or more repeated characters
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
    return /(.)\1{2,}/.test(password);
  }

  private generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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