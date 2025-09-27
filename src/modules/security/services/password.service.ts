import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPasswordService, PasswordValidationOptions, PasswordValidationResult } from '../interfaces/security.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly saltRounds: number;
  private readonly defaultValidationOptions: Required<PasswordValidationOptions> = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPasswords: [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ],
  };

  constructor(private readonly configService: ConfigService) {
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      this.logger.log('Password hashed successfully');
      return hash;
    } catch (error) {
      this.logger.error('Failed to hash password', error);
      throw new Error('Password hashing failed');
    }
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      this.logger.log(`Password validation: ${isValid ? 'success' : 'failed'}`);
      return isValid;
    } catch (error) {
      this.logger.error('Failed to validate password', error);
      return false;
    }
  }

  validatePasswordStrength(
    password: string,
    options?: PasswordValidationOptions,
  ): PasswordValidationResult {
    const opts = { ...this.defaultValidationOptions, ...options };
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < opts.minLength) {
      errors.push(`Password must be at least ${opts.minLength} characters long`);
    } else {
      score += 1;
    }

    // Check for uppercase letters
    if (opts.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Check for lowercase letters
    if (opts.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Check for numbers
    if (opts.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // Check for special characters
    if (opts.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Check against forbidden passwords
    if (opts.forbiddenPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and not allowed');
      score = 0;
    }

    // Check for repeated characters
    if (/(..).*\1/.test(password)) {
      errors.push('Password should not contain repeated patterns');
    }

    // Additional scoring for complexity
    if (password.length >= 12) score += 1;
    if (/[A-Z].*[A-Z]/.test(password)) score += 0.5;
    if (/\d.*\d/.test(password)) score += 0.5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 0.5;

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 3) {
      strength = 'weak';
    } else if (score < 5) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    const isValid = errors.length === 0;
    
    this.logger.log(`Password strength validation: ${strength}, valid: ${isValid}`);
    
    return {
      isValid,
      errors,
      strength,
    };
  }

  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    const generatedPassword = passwordArray.join('');
    this.logger.log('Secure password generated');
    
    return generatedPassword;
  }
}