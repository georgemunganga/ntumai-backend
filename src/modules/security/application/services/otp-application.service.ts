import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface GenerateOtpOptions {
  identifier: string;
  purpose: string;
  expiryMinutes?: number;
  codeLength?: number;
  alphanumeric?: boolean;
}

interface ValidateOtpOptions {
  identifier: string;
  code: string;
  purpose: string;
  otpId?: string;
}

interface OtpRecord {
  identifier: string;
  purpose: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpApplicationService {
  private readonly otpStore = new Map<string, OtpRecord>();

  async generateOtp(options: GenerateOtpOptions) {
    const {
      identifier,
      purpose,
      expiryMinutes = 5,
      codeLength = 6,
      alphanumeric = false,
    } = options;

    const code = this.generateCode(codeLength, alphanumeric);
    const otpId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);

    this.otpStore.set(otpId, {
      identifier: identifier.toLowerCase(),
      purpose,
      code,
      expiresAt,
    });

    return {
      otpId,
      code,
      expiresAt,
      deliveryStatus: {
        sent: true,
        channel: identifier.includes('@') ? 'email' : 'sms',
        error: undefined,
      },
    };
  }

  async validateOtp(options: ValidateOtpOptions) {
    const { identifier, code, purpose, otpId } = options;
    const normalizedIdentifier = identifier.toLowerCase();

    const matchingEntry = otpId
      ? this.lookupById(otpId)
      : this.lookupByIdentifier(normalizedIdentifier, purpose);

    if (!matchingEntry) {
      return { isValid: false };
    }

    const [id, record] = matchingEntry;

    if (record.identifier !== normalizedIdentifier || record.purpose !== purpose) {
      return { isValid: false };
    }

    if (record.expiresAt.getTime() < Date.now()) {
      this.otpStore.delete(id);
      return { isValid: false };
    }

    if (record.code !== code) {
      return { isValid: false };
    }

    this.otpStore.delete(id);
    return { isValid: true };
  }

  private lookupById(otpId: string): [string, OtpRecord] | undefined {
    const record = this.otpStore.get(otpId);
    return record ? [otpId, record] : undefined;
  }

  private lookupByIdentifier(identifier: string, purpose: string): [string, OtpRecord] | undefined {
    for (const entry of this.otpStore.entries()) {
      const [, record] = entry;
      if (record.identifier === identifier && record.purpose === purpose) {
        return entry;
      }
    }
    return undefined;
  }

  private generateCode(length: number, alphanumeric: boolean): string {
    if (alphanumeric) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * characters.length);
        result += characters[index];
      }
      return result;
    }

    const max = 10 ** length;
    const min = 10 ** (length - 1);
    return Math.floor(Math.random() * (max - min) + min).toString();
  }
}
