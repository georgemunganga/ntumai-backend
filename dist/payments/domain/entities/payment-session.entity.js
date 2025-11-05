"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.PaymentMethodType = exports.PaymentSession = exports.NextActionType = exports.SessionStatus = void 0;
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["REQUIRES_ACTION"] = "requires_action";
    SessionStatus["PROCESSING"] = "processing";
    SessionStatus["SUCCEEDED"] = "succeeded";
    SessionStatus["FAILED"] = "failed";
    SessionStatus["CANCELLED"] = "cancelled";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var NextActionType;
(function (NextActionType) {
    NextActionType["REDIRECT"] = "redirect";
    NextActionType["STK_PUSH"] = "stk_push";
    NextActionType["QR"] = "qr";
    NextActionType["USSD"] = "ussd";
    NextActionType["NONE"] = "none";
})(NextActionType || (exports.NextActionType = NextActionType = {}));
class PaymentSession {
    id;
    intent_id;
    method;
    status;
    next_action;
    provider_ref;
    receipt_url;
    error_message;
    created_at;
    updated_at;
    constructor(id, intent_id, method, status, next_action, provider_ref, receipt_url, error_message, created_at, updated_at) {
        this.id = id;
        this.intent_id = intent_id;
        this.method = method;
        this.status = status;
        this.next_action = next_action;
        this.provider_ref = provider_ref;
        this.receipt_url = receipt_url;
        this.error_message = error_message;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static create(params) {
        return new PaymentSession(params.id, params.intent_id, params.method, SessionStatus.REQUIRES_ACTION, params.next_action || null, null, null, null, new Date(), new Date());
    }
    markProcessing(providerRef) {
        this.status = SessionStatus.PROCESSING;
        if (providerRef) {
            this.provider_ref = providerRef;
        }
        this.updated_at = new Date();
    }
    markSucceeded(receiptUrl) {
        this.status = SessionStatus.SUCCEEDED;
        if (receiptUrl) {
            this.receipt_url = receiptUrl;
        }
        this.updated_at = new Date();
    }
    markFailed(errorMessage) {
        this.status = SessionStatus.FAILED;
        this.error_message = errorMessage;
        this.updated_at = new Date();
    }
    markCancelled() {
        this.status = SessionStatus.CANCELLED;
        this.updated_at = new Date();
    }
}
exports.PaymentSession = PaymentSession;
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CASH_ON_DELIVERY"] = "cash_on_delivery";
    PaymentMethodType["MOBILE_MONEY"] = "mobile_money";
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["WALLET"] = "wallet";
    PaymentMethodType["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
class PaymentMethod {
    method;
    type;
    display_name;
    currency;
    regions;
    capabilities;
    availability;
    fields;
    adapter_config;
    created_at;
    updated_at;
    constructor(method, type, display_name, currency, regions, capabilities, availability, fields, adapter_config, created_at, updated_at) {
        this.method = method;
        this.type = type;
        this.display_name = display_name;
        this.currency = currency;
        this.regions = regions;
        this.capabilities = capabilities;
        this.availability = availability;
        this.fields = fields;
        this.adapter_config = adapter_config;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static create(params) {
        return new PaymentMethod(params.method, params.type, params.display_name, params.currency, params.regions, params.capabilities, { available: true, reason: null }, params.fields || [], params.adapter_config || {}, new Date(), new Date());
    }
    setAvailability(available, reason) {
        this.availability = { available, reason: reason || null };
        this.updated_at = new Date();
    }
    isAvailable() {
        return this.availability.available;
    }
    supportsCurrency(currency) {
        return this.currency.includes(currency);
    }
    supportsRegion(region) {
        return this.regions.includes(region);
    }
}
exports.PaymentMethod = PaymentMethod;
//# sourceMappingURL=payment-session.entity.js.map