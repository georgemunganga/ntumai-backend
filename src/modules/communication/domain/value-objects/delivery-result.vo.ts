export interface CommunicationErrorData {
  code: string;
  message: string;
  isRetryable?: boolean;
  details?: Record<string, any>;
}

export class CommunicationError {
  private constructor(
    private readonly _code: string,
    private readonly _message: string,
    private readonly _isRetryable: boolean,
    private readonly _details?: Record<string, any>,
  ) {}

  static create(data: CommunicationErrorData): CommunicationError {
    if (!data.code || data.code.trim().length === 0) {
      throw new Error('Error code cannot be empty');
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new Error('Error message cannot be empty');
    }

    return new CommunicationError(
      data.code.trim().toUpperCase(),
      data.message.trim(),
      data.isRetryable ?? false,
      data.details,
    );
  }

  static networkError(message: string, details?: Record<string, any>): CommunicationError {
    return new CommunicationError('NETWORK_ERROR', message, true, details);
  }

  static authenticationError(message: string, details?: Record<string, any>): CommunicationError {
    return new CommunicationError('AUTHENTICATION_ERROR', message, false, details);
  }

  static validationError(message: string, details?: Record<string, any>): CommunicationError {
    return new CommunicationError('VALIDATION_ERROR', message, false, details);
  }

  static rateLimitError(message: string, retryAfterMs?: number): CommunicationError {
    return new CommunicationError('RATE_LIMIT_ERROR', message, true, { retryAfterMs });
  }

  static providerError(message: string, providerCode?: string): CommunicationError {
    return new CommunicationError('PROVIDER_ERROR', message, true, { providerCode });
  }

  get code(): string {
    return this._code;
  }

  get message(): string {
    return this._message;
  }

  get isRetryable(): boolean {
    return this._isRetryable;
  }

  get details(): Record<string, any> | undefined {
    return this._details;
  }

  getDetail<T = any>(key: string): T | undefined {
    return this._details?.[key] as T;
  }

  toString(): string {
    return `${this._code}: ${this._message}`;
  }
}

export interface DeliveryResultData {
  success: boolean;
  messageId?: string;
  providerId?: string;
  error?: CommunicationError;
  retryCount?: number;
  deliveredAt?: Date;
}

export class DeliveryResult {
  private constructor(
    private readonly _success: boolean,
    private readonly _deliveredAt: Date,
    private readonly _retryCount: number,
    private readonly _messageId?: string,
    private readonly _providerId?: string,
    private readonly _error?: CommunicationError,
  ) {}

  static success(messageId: string, providerId?: string, retryCount = 0): DeliveryResult {
    if (!messageId || messageId.trim().length === 0) {
      throw new Error('Message ID cannot be empty for successful delivery');
    }

    return new DeliveryResult(
      true,
      new Date(),
      retryCount,
      messageId.trim(),
      providerId?.trim(),
    );
  }

  static failure(error: CommunicationError, retryCount = 0): DeliveryResult {
    if (!error) {
      throw new Error('Error cannot be null for failed delivery');
    }

    return new DeliveryResult(
      false,
      new Date(),
      retryCount,
      undefined,
      undefined,
      error,
    );
  }

  static fromData(data: DeliveryResultData): DeliveryResult {
    if (data.success && !data.messageId) {
      throw new Error('Message ID is required for successful delivery');
    }

    if (!data.success && !data.error) {
      throw new Error('Error is required for failed delivery');
    }

    return new DeliveryResult(
      data.success,
      data.deliveredAt || new Date(),
      data.retryCount || 0,
      data.messageId,
      data.providerId,
      data.error,
    );
  }

  get success(): boolean {
    return this._success;
  }

  get messageId(): string | undefined {
    return this._messageId;
  }

  get providerId(): string | undefined {
    return this._providerId;
  }

  get deliveredAt(): Date {
    return this._deliveredAt;
  }

  get error(): CommunicationError | undefined {
    return this._error;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get isRetryable(): boolean {
    return !this._success && this._error?.isRetryable === true;
  }

  get hasProvider(): boolean {
    return this._providerId !== undefined;
  }

  // Create a copy with incremented retry count
  withRetry(): DeliveryResult {
    return new DeliveryResult(
      this._success,
      this._deliveredAt,
      this._retryCount + 1,
      this._messageId,
      this._providerId,
      this._error,
    );
  }

  // Convert to plain object for logging/serialization
  toPlainObject(): Record<string, any> {
    return {
      success: this._success,
      messageId: this._messageId,
      providerId: this._providerId,
      deliveredAt: this._deliveredAt.toISOString(),
      retryCount: this._retryCount,
      error: this._error ? {
        code: this._error.code,
        message: this._error.message,
        isRetryable: this._error.isRetryable,
        details: this._error.details,
      } : undefined,
    };
  }

  toString(): string {
    if (this._success) {
      return `DeliveryResult(success=true, messageId=${this._messageId}, retryCount=${this._retryCount})`;
    } else {
      return `DeliveryResult(success=false, error=${this._error?.toString()}, retryCount=${this._retryCount})`;
    }
  }
}