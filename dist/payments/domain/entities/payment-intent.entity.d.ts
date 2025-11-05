export declare enum IntentStatus {
    REQUIRES_METHOD = "requires_method",
    REQUIRES_CONFIRMATION = "requires_confirmation",
    PROCESSING = "processing",
    REQUIRES_ACTION = "requires_action",
    SUCCEEDED = "succeeded",
    CAPTURED = "captured",
    FAILED = "failed",
    CANCELLED = "cancelled"
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
export declare class PaymentIntent {
    readonly id: string;
    status: IntentStatus;
    amount: number;
    readonly currency: string;
    readonly client_secret: string;
    reference: PaymentReference;
    calc_sig: CalcSignature | null;
    selected_method: string | null;
    payer: {
        user_id?: string;
        email?: string;
        phone?: string;
    };
    metadata: Record<string, any>;
    readonly created_at: Date;
    updated_at: Date;
    constructor(id: string, status: IntentStatus, amount: number, currency: string, client_secret: string, reference: PaymentReference, calc_sig: CalcSignature | null, selected_method: string | null, payer: {
        user_id?: string;
        email?: string;
        phone?: string;
    }, metadata: Record<string, any>, created_at: Date, updated_at: Date);
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
    }): PaymentIntent;
    selectMethod(method: string): void;
    markProcessing(): void;
    markRequiresAction(): void;
    markSucceeded(): void;
    markCaptured(): void;
    markFailed(): void;
    markCancelled(): void;
    canConfirm(): boolean;
    canCapture(): boolean;
    canCancel(): boolean;
}
