"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentIntent = exports.IntentStatus = void 0;
var IntentStatus;
(function (IntentStatus) {
    IntentStatus["REQUIRES_METHOD"] = "requires_method";
    IntentStatus["REQUIRES_CONFIRMATION"] = "requires_confirmation";
    IntentStatus["PROCESSING"] = "processing";
    IntentStatus["REQUIRES_ACTION"] = "requires_action";
    IntentStatus["SUCCEEDED"] = "succeeded";
    IntentStatus["CAPTURED"] = "captured";
    IntentStatus["FAILED"] = "failed";
    IntentStatus["CANCELLED"] = "cancelled";
})(IntentStatus || (exports.IntentStatus = IntentStatus = {}));
class PaymentIntent {
    id;
    status;
    amount;
    currency;
    client_secret;
    reference;
    calc_sig;
    selected_method;
    payer;
    metadata;
    created_at;
    updated_at;
    constructor(id, status, amount, currency, client_secret, reference, calc_sig, selected_method, payer, metadata, created_at, updated_at) {
        this.id = id;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.client_secret = client_secret;
        this.reference = reference;
        this.calc_sig = calc_sig;
        this.selected_method = selected_method;
        this.payer = payer;
        this.metadata = metadata;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static create(params) {
        return new PaymentIntent(params.id, IntentStatus.REQUIRES_METHOD, params.amount, params.currency, params.client_secret, params.reference, params.calc_sig || null, null, params.payer || {}, params.metadata || {}, new Date(), new Date());
    }
    selectMethod(method) {
        this.selected_method = method;
        this.status = IntentStatus.REQUIRES_CONFIRMATION;
        this.updated_at = new Date();
    }
    markProcessing() {
        this.status = IntentStatus.PROCESSING;
        this.updated_at = new Date();
    }
    markRequiresAction() {
        this.status = IntentStatus.REQUIRES_ACTION;
        this.updated_at = new Date();
    }
    markSucceeded() {
        this.status = IntentStatus.SUCCEEDED;
        this.updated_at = new Date();
    }
    markCaptured() {
        this.status = IntentStatus.CAPTURED;
        this.updated_at = new Date();
    }
    markFailed() {
        this.status = IntentStatus.FAILED;
        this.updated_at = new Date();
    }
    markCancelled() {
        this.status = IntentStatus.CANCELLED;
        this.updated_at = new Date();
    }
    canConfirm() {
        return (this.status === IntentStatus.REQUIRES_METHOD ||
            this.status === IntentStatus.REQUIRES_CONFIRMATION);
    }
    canCapture() {
        return this.status === IntentStatus.SUCCEEDED;
    }
    canCancel() {
        return (this.status === IntentStatus.REQUIRES_METHOD ||
            this.status === IntentStatus.REQUIRES_CONFIRMATION ||
            this.status === IntentStatus.REQUIRES_ACTION);
    }
}
exports.PaymentIntent = PaymentIntent;
//# sourceMappingURL=payment-intent.entity.js.map