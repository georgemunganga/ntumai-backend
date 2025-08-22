import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _hashedValue: string;
  private readonly _isHashed: boolean;

  private constructor(value: string, isHashed: boolean = false) {
    this._hashedValue = value;
    this._isHashed = isHashed;
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  get isHashed(): boolean {
    return this._isHashed;
  }

  private static validate(password: string): void {
    if (!password || password.trim().length === 0) {
      throw new BadRequestException('Password cannot be empty');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new BadRequestException('Password is too long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  static async create(plainPassword: string): Promise<Password> {
    this.validate(plainPassword);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return new Password(hashedPassword, true);
  }

  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword || hashedPassword.trim().length === 0) {
      throw new BadRequestException('Hashed password cannot be empty');
    }
    return new Password(hashedPassword, true);
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (!this._isHashed) {
      throw new Error('Cannot compare with unhashed password');
    }
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue && this._isHashed === other._isHashed;
  }
}