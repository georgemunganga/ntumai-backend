export declare enum SessionStatus {
    REQUIRES_ACTION = "requires_action",
    PROCESSING = "processing",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum NextActionType {
    REDIRECT = "redirect",
    STK_PUSH = "stk_push",
    QR = "qr",
    USSD = "ussd",
    NONE = "none"
}
export interface NextAction {
    type: NextActionType;
    details: Record<string, any>;
}
export declare class PaymentSession {
    readonly id: string;
    readonly intent_id: string;
    readonly method: string;
    status: SessionStatus;
    next_action: NextAction | null;
    provider_ref: string | null;
    receipt_url: string | null;
    error_message: string | null;
    readonly created_at: Date;
    updated_at: Date;
    constructor(id: string, intent_id: string, method: string, status: SessionStatus, next_action: NextAction | null, provider_ref: string | null, receipt_url: string | null, error_message: string | null, created_at: Date, updated_at: Date);
    static create(params: {
        id: string;
        intent_id: string;
        method: string;
        next_action?: NextAction;
    }): PaymentSession;
    markProcessing(providerRef?: string): void;
    markSucceeded(receiptUrl?: string): void;
    markFailed(errorMessage: string): void;
    markCancelled(): void;
}
export declare enum PaymentMethodType {
    CASH_ON_DELIVERY = "cash_on_delivery",
    MOBILE_MONEY = "mobile_money",
    CARD = "card",
    WALLET = "wallet",
    BANK_TRANSFER = "bank_transfer"
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
export declare class PaymentMethod {
    readonly method: string;
    readonly type: PaymentMethodType;
    display_name: string;
    currency: string[];
    regions: string[];
    capabilities: MethodCapabilities;
    availability: {
        available: boolean;
        reason: string | null;
    };
    fields: MethodField[];
    adapter_config: Record<string, any>;
    readonly created_at: Date;
    updated_at: Date;
    constructor(method: string, type: PaymentMethodType, display_name: string, currency: string[], regions: string[], capabilities: MethodCapabilities, availability: {
        available: boolean;
        reason: string | null;
    }, fields: MethodField[], adapter_config: Record<string, any>, created_at: Date, updated_at: Date);
    static create(params: {
        method: string;
        type: PaymentMethodType;
        display_name: string;
        currency: string[];
        regions: string[];
        capabilities: MethodCapabilities;
        fields?: MethodField[];
        adapter_config?: Record<string, any>;
    }): PaymentMethod;
    setAvailability(available: boolean, reason?: string): void;
    isAvailable(): boolean;
    supportsCurrency(currency: string): boolean;
    supportsRegion(region: string): boolean;
}
