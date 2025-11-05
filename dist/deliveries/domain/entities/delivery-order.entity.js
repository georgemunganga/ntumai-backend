"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryOrder = exports.PaymentMethod = exports.VehicleType = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["BOOKED"] = "booked";
    OrderStatus["DELIVERY"] = "delivery";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["MOTORBIKE"] = "motorbike";
    VehicleType["BICYCLE"] = "bicycle";
    VehicleType["WALKING"] = "walking";
    VehicleType["TRUCK"] = "truck";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH_ON_DELIVERY"] = "cash_on_delivery";
    PaymentMethod["MOBILE_MONEY"] = "mobile_money";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["WALLET"] = "wallet";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
class DeliveryOrder {
    id;
    created_by_user_id;
    placed_by_role;
    vehicle_type;
    courier_comment;
    is_scheduled;
    scheduled_at;
    order_status;
    payment;
    stops;
    attachments;
    more_info;
    rider_id;
    ready_token;
    ready_token_expires_at;
    created_at;
    updated_at;
    constructor(id, created_by_user_id, placed_by_role, vehicle_type, courier_comment, is_scheduled, scheduled_at, order_status, payment, stops, attachments, more_info, rider_id, ready_token, ready_token_expires_at, created_at, updated_at) {
        this.id = id;
        this.created_by_user_id = created_by_user_id;
        this.placed_by_role = placed_by_role;
        this.vehicle_type = vehicle_type;
        this.courier_comment = courier_comment;
        this.is_scheduled = is_scheduled;
        this.scheduled_at = scheduled_at;
        this.order_status = order_status;
        this.payment = payment;
        this.stops = stops;
        this.attachments = attachments;
        this.more_info = more_info;
        this.rider_id = rider_id;
        this.ready_token = ready_token;
        this.ready_token_expires_at = ready_token_expires_at;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static create(params) {
        return new DeliveryOrder(params.id, params.created_by_user_id, params.placed_by_role, params.vehicle_type, params.courier_comment || null, params.is_scheduled || false, params.scheduled_at || null, OrderStatus.BOOKED, {
            method: null,
            calc_payload: null,
            calc_sig: null,
            currency: null,
            amount: null,
            expires_at: null,
        }, [], [], params.more_info || null, null, null, null, new Date(), new Date());
    }
    addStop(stop) {
        this.stops.push(stop);
        this.updated_at = new Date();
    }
    removeStop(stopId) {
        this.stops = this.stops.filter((s) => s.id !== stopId);
        this.updated_at = new Date();
    }
    updateStop(stopId, updates) {
        const stopIndex = this.stops.findIndex((s) => s.id === stopId);
        if (stopIndex !== -1) {
            const existing = this.stops[stopIndex];
            this.stops[stopIndex] = Object.assign(Object.create(Object.getPrototypeOf(existing)), existing, updates);
            this.updated_at = new Date();
        }
    }
    reorderStops(stopIds) {
        const reordered = [];
        for (const id of stopIds) {
            const stop = this.stops.find((s) => s.id === id);
            if (stop) {
                reordered.push(stop);
            }
        }
        this.stops = reordered;
        this.updated_at = new Date();
    }
    attachPricing(calc_payload, calc_sig, currency, amount, expires_at) {
        this.payment = {
            ...this.payment,
            calc_payload,
            calc_sig,
            currency,
            amount,
            expires_at,
        };
        this.updated_at = new Date();
    }
    setPaymentMethod(method) {
        this.payment = {
            ...this.payment,
            method,
        };
        this.updated_at = new Date();
    }
    setReadyToken(token, expiresAt) {
        this.ready_token = token;
        this.ready_token_expires_at = expiresAt;
        this.updated_at = new Date();
    }
    assignRider(riderId) {
        this.rider_id = riderId;
        this.updated_at = new Date();
    }
    markAsDelivery() {
        this.order_status = OrderStatus.DELIVERY;
        this.updated_at = new Date();
    }
    isPricingValid() {
        if (!this.payment.calc_sig || !this.payment.expires_at) {
            return false;
        }
        return new Date() < this.payment.expires_at;
    }
    isReadyTokenValid() {
        if (!this.ready_token || !this.ready_token_expires_at) {
            return false;
        }
        return new Date() < this.ready_token_expires_at;
    }
    canSubmit() {
        return (this.payment.method !== null &&
            this.payment.calc_sig !== null &&
            this.isPricingValid() &&
            this.stops.length >= 2);
    }
}
exports.DeliveryOrder = DeliveryOrder;
//# sourceMappingURL=delivery-order.entity.js.map