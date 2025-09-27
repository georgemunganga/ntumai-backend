import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenPasswords?: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export class Password {
  private readonly _value: string;
  private readonly _hashedValue?: string;

  private constructor(value: string, hashedValue?: string) {
    this._value = value;
    this._hashedValue = hashedValue;
  }

  get value(): string {
    return this._value;
  }

  get hashedValue(): string | undefined {
    return this._hashedValue;
  }

  /**
   * Create a Password from plain text with validation
   */
  static async create(plainPassword: string, options?: PasswordValidationOptions): Promise<Password> {
    const validation = Password.validateStrength(plainPassword, options);
    
    if (!validation.isValid) {
      throw new BadRequestException(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    const hashedValue = await bcrypt.hash(plainPassword, 12);
    return new Password(plainPassword, hashedValue);
  }

  /**
   * Create a Password from already hashed value (for reconstruction from database)
   */
  static fromHash(hashedValue: string): Password {
    return new Password('', hashedValue);
  }

  /**
   * Validate password strength without creating the object
   */
  static validateStrength(
    password: string,
    options?: PasswordValidationOptions
  ): PasswordValidationResult {
    const opts: Required<PasswordValidationOptions> = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbiddenPasswords: ['password', '123456', 'admin', 'user'],
      ...options,
    };

    const errors: string[] = [];
    let strengthScore = 0;

    // Basic validation
    if (!password || password.trim().length === 0) {
      errors.push('Password cannot be empty');
      return { isValid: false, errors, strength: 'weak' };
    }

    // Length validation
    if (password.length < opts.minLength) {
      errors.push(`Password must be at least ${opts.minLength} characters long`);
    } else {
      strengthScore += 1;
    }

    // Character type validations
    if (opts.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (opts.requireUppercase) {
      strengthScore += 1;
    }

    if (opts.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (opts.requireLowercase) {
      strengthScore += 1;
    }

    if (opts.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (opts.requireNumbers) {
      strengthScore += 1;
    }

    if (opts.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (opts.requireSpecialChars) {
      strengthScore += 1;
    }

    // Forbidden passwords check
    const lowerPassword = password.toLowerCase();
    if (opts.forbiddenPasswords.some(forbidden => lowerPassword.includes(forbidden.toLowerCase()))) {
      errors.push('Password contains forbidden words or patterns');
    }

    // Common patterns check
    if (Password.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns');
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (strengthScore >= 4 && password.length >= 12) {
      strength = 'strong';
    } else if (strengthScore >= 3 && password.length >= 8) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Verify if a plain password matches this hashed password
   */
  async verify(plainPassword: string): Promise<boolean> {
    if (!this._hashedValue) {
      throw new Error('Cannot verify password without hashed value');
    }
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  /**
   * Generate a secure random password
   */
  static generateSecure(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + specialChars;

    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/i,
      /password/i,
      /admin/i,
      /(.)\1{2,}/, // Three or more repeated characters
      /012345/,
      /987654/,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }

  toString(): string {
    return '[Password]'; // Never expose the actual password
  }

  /**
   * Get the hashed value for persistence
   */
  toHash(): string {
    if (!this._hashedValue) {
      throw new Error('Password must be hashed before persistence');
    }
    return this._hashedValue;
  }
}