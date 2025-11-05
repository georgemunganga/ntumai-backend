export enum IntentStatus {
  REQUIRES_METHOD = 'requires_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  SUCCEEDED = 'succeeded',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface CalcSignature {
  sig: string;
  expires_at: string;
}

export interface PaymentReference {
  delivery_id?: string;
  marketplace_order_id?: string;
  custom_reference?: string;
}

export class PaymentIntent {
  constructor(
    public readonly id: string,
    public status: IntentStatus,
    public amount: number, // in minor units (e.g., ngwee)
    public readonly currency: string,
    public readonly client_secret: string,
    public reference: PaymentReference,
    public calc_sig: CalcSignature | null,
    public selected_method: string | null,
    public payer: {
      user_id?: string;
      email?: string;
      phone?: string;
    },
    public metadata: Record<string, any>,
    public readonly created_at: Date,
    public updated_at: Date,
  ) {}

  static create(params: {
    id: string;
    amount: number;
    currency: string;
    client_secret: string;
    reference: PaymentReference;
    calc_sig?: CalcSignature;
    payer?: {
      user_id?: string;
      email?: string;
      phone?: string;
    };
    metadata?: Record<string, any>;
  }): PaymentIntent {
    return new PaymentIntent(
      params.id,
      IntentStatus.REQUIRES_METHOD,
      params.amount,
      params.currency,
      params.client_secret,
      params.reference,
      params.calc_sig || null,
      null,
      params.payer || {},
      params.metadata || {},
      new Date(),
      new Date(),
    );
  }

  selectMethod(method: string): void {
    this.selected_method = method;
    this.status = IntentStatus.REQUIRES_CONFIRMATION;
    this.updated_at = new Date();
  }

  markProcessing(): void {
    this.status = IntentStatus.PROCESSING;
    this.updated_at = new Date();
  }

  markRequiresAction(): void {
    this.status = IntentStatus.REQUIRES_ACTION;
    this.updated_at = new Date();
  }

  markSucceeded(): void {
    this.status = IntentStatus.SUCCEEDED;
    this.updated_at = new Date();
  }

  markCaptured(): void {
    this.status = IntentStatus.CAPTURED;
    this.updated_at = new Date();
  }

  markFailed(): void {
    this.status = IntentStatus.FAILED;
    this.updated_at = new Date();
  }

  markCancelled(): void {
    this.status = IntentStatus.CANCELLED;
    this.updated_at = new Date();
  }

  canConfirm(): boolean {
    return (
      this.status === IntentStatus.REQUIRES_METHOD ||
      this.status === IntentStatus.REQUIRES_CONFIRMATION
    );
  }

  canCapture(): boolean {
    return this.status === IntentStatus.SUCCEEDED;
  }

  canCancel(): boolean {
    return (
      this.status === IntentStatus.REQUIRES_METHOD ||
      this.status === IntentStatus.REQUIRES_CONFIRMATION ||
      this.status === IntentStatus.REQUIRES_ACTION
    );
  }
}
