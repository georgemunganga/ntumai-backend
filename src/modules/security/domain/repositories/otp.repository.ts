import { Otp, OtpPurpose } from '../entities/otp.entity';

export interface FindOtpOptions {
  identifier?: string;
  purpose?: OtpPurpose;
  isUsed?: boolean;
  includeExpired?: boolean;
}

export interface OtpFilters {
  identifier?: string;
  purpose?: OtpPurpose;
  isUsed?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedOtpResult {
  data: Otp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class OtpRepository {
  /**
   * Save an OTP (create or update)
   */
  abstract save(otp: Otp): Promise<Otp>;

  /**
   * Find OTP by ID
   */
  abstract findById(id: string): Promise<Otp | null>;

  /**
   * Find the most recent valid OTP for an identifier and purpose
   */
  abstract findValidOtp(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<Otp | null>;

  /**
   * Find OTP with options
   */
  abstract findOne(options: FindOtpOptions): Promise<Otp | null>;

  /**
   * Find multiple OTPs with filters
   */
  abstract findMany(filters: OtpFilters): Promise<Otp[]>;

  /**
   * Find OTPs with pagination
   */
  abstract findWithPagination(
    filters: OtpFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedOtpResult>;

  /**
   * Delete OTP by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Delete expired OTPs
   */
  abstract deleteExpired(): Promise<number>;

  /**
   * Delete OTPs older than specified date
   */
  abstract deleteOlderThan(date: Date): Promise<number>;

  /**
   * Count OTPs with filters
   */
  abstract count(filters: OtpFilters): Promise<number>;

  /**
   * Count OTPs for identifier within time period
   */
  abstract countForIdentifierInPeriod(
    identifier: string,
    purpose: OtpPurpose,
    periodMinutes: number
  ): Promise<number>;

  /**
   * Invalidate all OTPs for identifier and purpose
   */
  abstract invalidateAllForIdentifierAndPurpose(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<void>;

  /**
   * Check if identifier has exceeded rate limit
   */
  abstract hasExceededRateLimit(
    identifier: string,
    purpose: OtpPurpose,
    maxOtpsPerPeriod: number,
    periodMinutes: number
  ): Promise<boolean>;
}