/**
 * Normalizes phone numbers to E.164 format
 * E.164 format: +[country code][number]
 * Example: +260972827372
 */
export class PhoneNormalizer {
  /**
   * Normalize a phone number to E.164 format
   * @param phone Raw phone number (can be with or without country code)
   * @param defaultCountryCode Default country code if not provided (e.g., '+260' for Zambia)
   * @returns Normalized phone in E.164 format or null if invalid
   */
  static normalize(phone: string, defaultCountryCode: string = '+260'): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');

    // If it starts with +, it's already in international format
    if (normalized.startsWith('+')) {
      return this.isValidE164(normalized) ? normalized : null;
    }

    // If it starts with 0 (local format), replace with country code
    if (normalized.startsWith('0')) {
      normalized = defaultCountryCode + normalized.substring(1);
      return this.isValidE164(normalized) ? normalized : null;
    }

    // If no leading +, assume it's missing the country code
    if (!normalized.startsWith('+')) {
      normalized = defaultCountryCode + normalized;
      return this.isValidE164(normalized) ? normalized : null;
    }

    return this.isValidE164(normalized) ? normalized : null;
  }

  /**
   * Check if a phone number is in valid E.164 format
   * E.164 format: +[1-3 digits country code][number]
   */
  private static isValidE164(phone: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Extract country code from E.164 formatted phone
   */
  static getCountryCode(phone: string): string | null {
    if (!phone.startsWith('+')) return null;
    
    // Most country codes are 1-3 digits
    const match = phone.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
  }

  /**
   * Extract number without country code
   */
  static getNumberOnly(phone: string): string | null {
    if (!phone.startsWith('+')) return null;
    
    const match = phone.match(/^\+\d{1,3}(.+)$/);
    return match ? match[1] : null;
  }
}
