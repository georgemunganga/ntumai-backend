export enum SessionStatus {
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NextActionType {
  REDIRECT = 'redirect',
  STK_PUSH = 'stk_push',
  QR = 'qr',
  USSD = 'ussd',
  NONE = 'none',
}

export interface NextAction {
  type: NextActionType;
  details: Record<string, any>;
}

export class PaymentSession {
  constructor(
    public readonly id: string,
    public readonly intent_id: string,
    public readonly method: string,
    public status: SessionStatus,
    public next_action: NextAction | null,
    public provider_ref: string | null,
    public receipt_url: string | null,
    public error_message: string | null,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  static create(params: {
    id: string;
    intent_id: string;
    method: string;
    next_action?: NextAction;
  }): PaymentSession {
    return new PaymentSession(
      params.id,
      params.intent_id,
      params.method,
      SessionStatus.REQUIRES_ACTION,
      params.next_action || null,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  markProcessing(providerRef?: string): void {
    this.status = SessionStatus.PROCESSING;
    if (providerRef) {
      this.provider_ref = providerRef;
    }
    this.updated_at = new Date();
  }

  markSucceeded(receiptUrl?: string): void {
    this.status = SessionStatus.SUCCEEDED;
    if (receiptUrl) {
      this.receipt_url = receiptUrl;
    }
    this.updated_at = new Date();
  }

  markFailed(errorMessage: string): void {
    this.status = SessionStatus.FAILED;
    this.error_message = errorMessage;
    this.updated_at = new Date();
  }

  markCancelled(): void {
    this.status = SessionStatus.CANCELLED;
    this.updated_at = new Date();
  }
}

export enum PaymentMethodType {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export interface MethodCapabilities {
  capture: boolean;
  refund: boolean;
  partial_refund: boolean;
  requires_redirect: boolean;
  stk_push: boolean;
  qr: boolean;
  three_ds: boolean;
}

export interface MethodField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: string;
}

export class PaymentMethod {
  constructor(
    public readonly method: string, // e.g., "mobile_money:airtel_zm"
    public readonly type: PaymentMethodType,
    public display_name: string,
    public currency: string[],
    public regions: string[],
    public capabilities: MethodCapabilities,
    public availability: {
      available: boolean;
      reason: string | null;
    },
    public fields: MethodField[],
    public adapter_config: Record<string, any>,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  static create(params: {
    method: string;
    type: PaymentMethodType;
    display_name: string;
    currency: string[];
    regions: string[];
    capabilities: MethodCapabilities;
    fields?: MethodField[];
    adapter_config?: Record<string, any>;
  }): PaymentMethod {
    return new PaymentMethod(
      params.method,
      params.type,
      params.display_name,
      params.currency,
      params.regions,
      params.capabilities,
      { available: true, reason: null },
      params.fields || [],
      params.adapter_config || {},
      new Date(),
      new Date(),
    );
  }

  setAvailability(available: boolean, reason?: string): void {
    this.availability = { available, reason: reason || null };
    this.updated_at = new Date();
  }

  isAvailable(): boolean {
    return this.availability.available;
  }

  supportsCurrency(currency: string): boolean {
    return this.currency.includes(currency);
  }

  supportsRegion(region: string): boolean {
    return this.regions.includes(region);
  }
}
