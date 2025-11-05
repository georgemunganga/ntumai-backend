export declare enum PaymentMethodType {
    CASH_ON_DELIVERY = "cash_on_delivery",
    MOBILE_MONEY = "mobile_money",
    CARD = "card",
    WALLET = "wallet",
    BANK_TRANSFER = "bank_transfer"
}
export declare class CreatePaymentIntentDto {
    amount: number;
    currency: string;
    reference?: {
        delivery_id?: string;
        marketplace_order_id?: string;
        custom_reference?: string;
    };
    calc_sig?: {
        sig: string;
        expires_at: string;
    };
    payer?: {
        user_id?: string;
        email?: string;
        phone?: string;
    };
    metadata?: Record<string, any>;
}
export declare class ConfirmPaymentIntentDto {
    method: string;
    method_params: Record<string, any>;
    return_url?: string;
}
export declare class CollectCashDto {
    collector_user_id: string;
    amount: number;
    evidence_photo_id?: string;
}
export declare class CreateRefundDto {
    amount: number;
    reason: string;
}
export declare class RegisterPaymentMethodDto {
    method: string;
    type: PaymentMethodType;
    display_name: string;
    regions: string[];
    currency: string[];
    capabilities: {
        capture: boolean;
        refund: boolean;
        partial_refund: boolean;
        requires_redirect: boolean;
        stk_push: boolean;
        qr: boolean;
        three_ds: boolean;
    };
    adapter_config?: Record<string, any>;
    fields?: Array<{
        name: string;
        label: string;
        type: string;
        required: boolean;
    }>;
}
