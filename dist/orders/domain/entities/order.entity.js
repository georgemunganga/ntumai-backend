"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.OrderStatus = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["MARKETPLACE"] = "marketplace";
    OrderType["DELIVERY"] = "delivery";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["IN_PROGRESS"] = "in_progress";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class Order {
    props;
    constructor(props) {
        this.props = props;
    }
    static fromPersistence(data) {
        return new Order(data);
    }
    get id() {
        return this.props.id;
    }
    get user_id() {
        return this.props.user_id;
    }
    get type() {
        return this.props.type;
    }
    get status() {
        return this.props.status;
    }
    get total_amount() {
        return this.props.total_amount;
    }
    toJSON() {
        return { ...this.props };
    }
}
exports.Order = Order;
//# sourceMappingURL=order.entity.js.map