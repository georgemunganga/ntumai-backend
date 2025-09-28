import { v4 as uuidv4 } from 'uuid';

export interface CommunicationContextData {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class CommunicationContext {
  private constructor(
    private readonly _requestId: string,
    private readonly _timestamp: Date,
    private readonly _userId?: string,
    private readonly _sessionId?: string,
    private readonly _metadata?: Record<string, any>,
  ) {}

  static create(data?: CommunicationContextData): CommunicationContext {
    const requestId = data?.requestId || uuidv4();
    const timestamp = new Date();

    // Validate userId if provided
    if (data?.userId && (typeof data.userId !== 'string' || data.userId.trim().length === 0)) {
      throw new Error('User ID must be a non-empty string');
    }

    // Validate sessionId if provided
    if (data?.sessionId && (typeof data.sessionId !== 'string' || data.sessionId.trim().length === 0)) {
      throw new Error('Session ID must be a non-empty string');
    }

    // Validate metadata if provided
    if (data?.metadata && typeof data.metadata !== 'object') {
      throw new Error('Metadata must be an object');
    }

    return new CommunicationContext(
      requestId,
      timestamp,
      data?.userId?.trim(),
      data?.sessionId?.trim(),
      data?.metadata,
    );
  }

  static fromRequest(requestId: string, userId?: string, sessionId?: string): CommunicationContext {
    return CommunicationContext.create({
      requestId,
      userId,
      sessionId,
    });
  }

  get requestId(): string {
    return this._requestId;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get sessionId(): string | undefined {
    return this._sessionId;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get hasUser(): boolean {
    return this._userId !== undefined;
  }

  get hasSession(): boolean {
    return this._sessionId !== undefined;
  }

  // Create a copy with additional metadata
  withMetadata(additionalMetadata: Record<string, any>): CommunicationContext {
    return new CommunicationContext(
      this._requestId,
      this._timestamp,
      this._userId,
      this._sessionId,
      { ...this._metadata, ...additionalMetadata },
    );
  }

  // Create a copy with user information
  withUser(userId: string, sessionId?: string): CommunicationContext {
    return new CommunicationContext(
      this._requestId,
      this._timestamp,
      userId,
      sessionId || this._sessionId,
      this._metadata,
    );
  }

  // Get metadata value by key
  getMetadata<T = any>(key: string): T | undefined {
    return this._metadata?.[key] as T;
  }

  // Check if metadata key exists
  hasMetadata(key: string): boolean {
    return this._metadata !== undefined && key in this._metadata;
  }

  // Convert to plain object for logging/serialization
  toPlainObject(): Record<string, any> {
    return {
      requestId: this._requestId,
      timestamp: this._timestamp.toISOString(),
      userId: this._userId,
      sessionId: this._sessionId,
      metadata: this._metadata,
    };
  }

  toString(): string {
    return `CommunicationContext(requestId=${this._requestId}, userId=${this._userId || 'anonymous'}, timestamp=${this._timestamp.toISOString()})`;
  }
}