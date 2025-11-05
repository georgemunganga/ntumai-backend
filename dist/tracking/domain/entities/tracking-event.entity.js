"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingEvent = exports.TrackingEventType = void 0;
const nanoid_1 = require("nanoid");
var TrackingEventType;
(function (TrackingEventType) {
    TrackingEventType["BOOKING_CREATED"] = "booking_created";
    TrackingEventType["RIDER_ASSIGNED"] = "rider_assigned";
    TrackingEventType["EN_ROUTE_TO_PICKUP"] = "en_route_to_pickup";
    TrackingEventType["ARRIVED_AT_PICKUP"] = "arrived_at_pickup";
    TrackingEventType["PICKED_UP"] = "picked_up";
    TrackingEventType["EN_ROUTE_TO_DROPOFF"] = "en_route_to_dropoff";
    TrackingEventType["ARRIVED_AT_DROPOFF"] = "arrived_at_dropoff";
    TrackingEventType["DELIVERED"] = "delivered";
    TrackingEventType["CANCELLED"] = "cancelled";
    TrackingEventType["LOCATION_UPDATE"] = "location_update";
})(TrackingEventType || (exports.TrackingEventType = TrackingEventType = {}));
class TrackingEvent {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(data) {
        return new TrackingEvent({
            id: `trk_${(0, nanoid_1.nanoid)(16)}`,
            booking_id: data.booking_id,
            delivery_id: data.delivery_id,
            event_type: data.event_type,
            location: data.location || null,
            rider_user_id: data.rider_user_id || null,
            metadata: data.metadata || {},
            timestamp: new Date(),
        });
    }
    static fromPersistence(data) {
        return new TrackingEvent(data);
    }
    get id() {
        return this.props.id;
    }
    get booking_id() {
        return this.props.booking_id;
    }
    get delivery_id() {
        return this.props.delivery_id;
    }
    get event_type() {
        return this.props.event_type;
    }
    get location() {
        return this.props.location;
    }
    get timestamp() {
        return this.props.timestamp;
    }
    toJSON() {
        return { ...this.props };
    }
}
exports.TrackingEvent = TrackingEvent;
//# sourceMappingURL=tracking-event.entity.js.map