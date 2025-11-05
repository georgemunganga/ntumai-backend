import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class Password {
  private readonly hashedValue: string;

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  static async create(plainPassword: string): Promise<Password> {
    this.validate(plainPassword);
    const hashed = await bcrypt.hash(plainPassword, 10);
    return new Password(hashed);
  }

  static fromHash(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  private static validate(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }
  }

  async compare(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  getValue(): string {
    return this.hashedValue;
  }
}
