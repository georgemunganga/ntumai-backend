import { CommunicationError } from '../interfaces/communication-domain.interface';

export class MessageRecipient {
  private constructor(
    private readonly _identifier: string,
    private readonly _type: 'email' | 'phone',
  ) {}

  static createEmail(email: string): MessageRecipient {
    if (!this.isValidEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return new MessageRecipient(email.toLowerCase().trim(), 'email');
  }

  static createPhone(phoneNumber: string): MessageRecipient {
    const cleanPhone = this.cleanPhoneNumber(phoneNumber);
    if (!this.isValidPhoneNumber(cleanPhone)) {
      throw new Error(`Invalid phone number: ${phoneNumber}`);
    }
    return new MessageRecipient(cleanPhone, 'phone');
  }

  get identifier(): string {
    return this._identifier;
  }

  get type(): 'email' | 'phone' {
    return this._type;
  }

  get isValid(): boolean {
    return this._type === 'email' 
      ? MessageRecipient.isValidEmail(this._identifier)
      : MessageRecipient.isValidPhoneNumber(this._identifier);
  }

  equals(other: MessageRecipient): boolean {
    return this._identifier === other._identifier && this._type === other._type;
  }

  toString(): string {
    return `${this._type}:${this._identifier}`;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private static isValidPhoneNumber(phone: string): boolean {
    // E.164 format validation (international phone number format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  private static cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's a local number and needs country code
    if (!cleaned.startsWith('+')) {
      // Default to US country code if no + prefix
      cleaned = '+1' + cleaned;
    }
    
    return cleaned;
  }
}