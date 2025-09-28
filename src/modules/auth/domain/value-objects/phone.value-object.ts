import { BadRequestException } from '@nestjs/common';

export class Phone {
  private readonly _value: string;
  private readonly _countryCode: string;
  private readonly _nationalNumber: string;

  constructor(value: string) {
    const cleanedValue = this.cleanPhoneNumber(value);
    this.validate(cleanedValue);
    
    const parsed = this.parsePhoneNumber(cleanedValue);
    this._countryCode = parsed.countryCode;
    this._nationalNumber = parsed.nationalNumber;
    this._value = `${this._countryCode}${this._nationalNumber}`;
  }

  get value(): string {
    return this._value;
  }

  get countryCode(): string {
    return this._countryCode;
  }

  get nationalNumber(): string {
    return this._nationalNumber;
  }

  get formattedValue(): string {
    // Format as +XX XXX XXX XXXX (example format)
    if (this._nationalNumber.length === 10) {
      return `${this._countryCode} ${this._nationalNumber.slice(0, 3)} ${this._nationalNumber.slice(3, 6)} ${this._nationalNumber.slice(6)}`;
    }
    return `${this._countryCode} ${this._nationalNumber}`;
  }

  private cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }

  private validate(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new BadRequestException('Phone number cannot be empty');
    }

    // Must start with + for international format
    if (!phone.startsWith('+')) {
      throw new BadRequestException('Phone number must include country code (start with +)');
    }

    // Remove + for length validation
    const digitsOnly = phone.slice(1);
    
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new BadRequestException('Phone number must be between 7 and 15 digits');
    }

    // Check if all characters after + are digits
    if (!/^\d+$/.test(digitsOnly)) {
      throw new BadRequestException('Phone number can only contain digits after country code');
    }
  }

  private parsePhoneNumber(phone: string): { countryCode: string; nationalNumber: string } {
    // Simple parsing - in production, consider using a library like libphonenumber
    const digitsOnly = phone.slice(1); // Remove +
    
    // Common country codes (this is simplified - in production use proper parsing)
    const countryCodePatterns = [
      { code: '+1', length: 1 },     // US/Canada
      { code: '+44', length: 2 },    // UK
      { code: '+49', length: 2 },    // Germany
      { code: '+33', length: 2 },    // France
      { code: '+86', length: 2 },    // China
      { code: '+91', length: 2 },    // India
      { code: '+81', length: 2 },    // Japan
      { code: '+82', length: 2 },    // South Korea
      { code: '+65', length: 2 },    // Singapore
      { code: '+60', length: 2 },    // Malaysia
    ];

    for (const pattern of countryCodePatterns) {
      const codeDigits = pattern.code.slice(1);
      if (digitsOnly.startsWith(codeDigits)) {
        return {
          countryCode: pattern.code,
          nationalNumber: digitsOnly.slice(pattern.length)
        };
      }
    }

    // Default: assume single digit country code
    return {
      countryCode: `+${digitsOnly.slice(0, 1)}`,
      nationalNumber: digitsOnly.slice(1)
    };
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): Phone {
    return new Phone(value);
  }

  static fromParts(countryCode: string, nationalNumber: string): Phone {
    const normalizedCountry = (countryCode || '').trim();
    const digits = (nationalNumber || '').replace(/[^\d]/g, '');

    if (!normalizedCountry) {
      throw new BadRequestException('Country code is required when using split phone input');
    }

    if (!digits) {
      throw new BadRequestException('Phone number cannot be empty');
    }

    const formattedCountry = normalizedCountry.startsWith('+')
      ? normalizedCountry
      : `+${normalizedCountry.replace(/[^\d]/g, '')}`;

    if (!/^\+\d{1,4}$/.test(formattedCountry)) {
      throw new BadRequestException('Country code must include the + prefix followed by digits');
    }

    return new Phone(`${formattedCountry}${digits}`);
  }
}