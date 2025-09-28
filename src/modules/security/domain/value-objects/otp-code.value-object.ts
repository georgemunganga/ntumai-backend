import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OtpGenerationOptions {
  length?: number;
  alphanumeric?: boolean;
}

export class OtpCode {
  private readonly _value: string;
  private readonly _hashedValue: string;

  private constructor(value: string, hashedValue: string) {
    this._value = value;
    this._hashedValue = hashedValue;
  }

  get value(): string {
    return this._value;
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  /**
   * Generate a new OTP code
   */
  static async generate(options?: OtpGenerationOptions): Promise<OtpCode> {
    const opts = {
      length: 6,
      alphanumeric: false,
      ...options,
    };

    const code = OtpCode.generateCode(opts.length, opts.alphanumeric);
    const hashedValue = await OtpCode.hashCode(code);
    
    return new OtpCode(code, hashedValue);
  }

  /**
   * Create OtpCode from existing hashed value (for reconstruction from database)
   */
  static fromHash(hashedValue: string): OtpCode {
    return new OtpCode('', hashedValue);
  }

  /**
   * Verify if a plain code matches this hashed OTP
   */
  async verify(plainCode: string): Promise<boolean> {
    if (!plainCode || plainCode.trim().length === 0) {
      return false;
    }

    const hashedInput = await OtpCode.hashCode(plainCode.trim());
    return hashedInput === this._hashedValue;
  }

  /**
   * Validate OTP code format
   */
  static validateFormat(code: string, expectedLength: number = 6): boolean {
    if (!code || code.trim().length === 0) {
      return false;
    }

    const trimmedCode = code.trim();
    
    // Check length
    if (trimmedCode.length !== expectedLength) {
      return false;
    }

    // Check if it contains only digits (for numeric OTP)
    if (!/^\d+$/.test(trimmedCode)) {
      return false;
    }

    return true;
  }

  private static generateCode(length: number, alphanumeric: boolean): string {
    if (length < 4 || length > 10) {
      throw new BadRequestException('OTP length must be between 4 and 10 characters');
    }

    const charset = alphanumeric 
      ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      : '0123456789';
    
    let code = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      code += charset[randomIndex];
    }

    return code;
  }

  private static async hashCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(code, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  equals(other: OtpCode): boolean {
    return this._hashedValue === other._hashedValue;
  }

  toString(): string {
    return '[OtpCode]'; // Never expose the actual code
  }

  /**
   * Get the hashed value for persistence
   */
  toHash(): string {
    return this._hashedValue;
  }
}