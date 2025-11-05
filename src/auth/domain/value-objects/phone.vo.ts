import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export class Phone {
  private readonly value: string; // E.164 format

  constructor(phone: string, countryCode?: string) {
    try {
      // If phone already includes country code (starts with +)
      if (phone.startsWith('+')) {
        if (!isValidPhoneNumber(phone)) {
          throw new BadRequestException('Invalid phone number');
        }
        const parsed = parsePhoneNumber(phone);
        this.value = parsed.number;
      } else {
        // Phone needs country code
        if (!countryCode) {
          throw new BadRequestException(
            'Country code required for phone number',
          );
        }
        const fullNumber = `${countryCode}${phone}`;
        if (!isValidPhoneNumber(fullNumber)) {
          throw new BadRequestException('Invalid phone number');
        }
        const parsed = parsePhoneNumber(fullNumber);
        this.value = parsed.number;
      }
    } catch (error) {
      throw new BadRequestException(`Invalid phone number: ${error.message}`);
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromE164(e164: string): Phone {
    return new Phone(e164);
  }
}
