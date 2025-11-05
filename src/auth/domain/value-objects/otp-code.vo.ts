import * as bcrypt from 'bcrypt';

export class OtpCode {
  private readonly code: string;

  private constructor(code: string) {
    this.code = code;
  }

  static generate(): OtpCode {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return new OtpCode(code);
  }

  static fromPlain(code: string): OtpCode {
    return new OtpCode(code);
  }

  async hash(): Promise<string> {
    return bcrypt.hash(this.code, 10);
  }

  async verify(hashedCode: string): Promise<boolean> {
    return bcrypt.compare(this.code, hashedCode);
  }

  getValue(): string {
    return this.code;
  }

  toString(): string {
    return this.code;
  }
}
