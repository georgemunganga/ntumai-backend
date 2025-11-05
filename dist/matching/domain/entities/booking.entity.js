"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = exports.BookingStatus = void 0;
const nanoid_1 = require("nanoid");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["SEARCHING"] = "searching";
    BookingStatus["OFFERED"] = "offered";
    BookingStatus["ACCEPTED"] = "accepted";
    BookingStatus["EN_ROUTE"] = "en_route";
    BookingStatus["ARRIVED_PICKUP"] = "arrived_pickup";
    BookingStatus["PICKED_UP"] = "picked_up";
    BookingStatus["EN_ROUTE_DROPOFF"] = "en_route_dropoff";
    BookingStatus["DELIVERED"] = "delivered";
    BookingStatus["CANCELLED"] = "cancelled";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
class Booking {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(data) {
        const now = new Date();
        return new Booking({
            booking_id: `bkg_${(0, nanoid_1.nanoid)(16)}`,
            delivery_id: data.delivery_id,
            status: BookingStatus.PENDING,
            vehicle_type: data.vehicle_type,
            pickup: data.pickup,
            dropoffs: data.dropoffs,
            rider: null,
            offer: {
                expires_at: null,
                offered_to: [],
            },
            wait_times: {
                pickup_sec: 0,
                dropoff_sec: 0,
            },
            can_user_edit: true,
            customer_user_id: data.customer_user_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            metadata: data.metadata || {},
            created_at: now,
            updated_at: now,
            pickup_wait_start: null,
            dropoff_wait_start: null,
        });
    }
    static fromPersistence(data) {
        return new Booking(data);
    }
    get booking_id() {
        return this.props.booking_id;
    }
    get delivery_id() {
        return this.props.delivery_id;
    }
    get status() {
        return this.props.status;
    }
    get rider() {
        return this.props.rider;
    }
    get wait_times() {
        return this.props.wait_times;
    }
    startSearching() {
        if (this.props.status !== BookingStatus.PENDING) {
            throw new Error('Can only start searching from pending status');
        }
        this.props.status = BookingStatus.SEARCHING;
        this.props.updated_at = new Date();
    }
    offerToRider(riderUserId, expiresInSec = 45) {
        if (this.props.status !== BookingStatus.SEARCHING) {
            throw new Error('Can only offer from searching status');
        }
        this.props.status = BookingStatus.OFFERED;
        this.props.offer.offered_to.push(riderUserId);
        this.props.offer.expires_at = new Date(Date.now() + expiresInSec * 1000);
        this.props.updated_at = new Date();
    }
    acceptByRider(rider) {
        if (this.props.status !== BookingStatus.OFFERED) {
            throw new Error('Can only accept from offered status');
        }
        this.props.status = BookingStatus.ACCEPTED;
        this.props.rider = rider;
        this.props.offer.expires_at = null;
        this.props.can_user_edit = true;
        this.props.updated_at = new Date();
    }
    declineByRider(riderUserId) {
        if (this.props.status !== BookingStatus.OFFERED) {
            throw new Error('Can only decline from offered status');
        }
        this.props.status = BookingStatus.SEARCHING;
        this.props.offer.expires_at = null;
        this.props.updated_at = new Date();
    }
    updateProgress(stage) {
        const validTransitions = {
            [BookingStatus.ACCEPTED]: [BookingStatus.EN_ROUTE],
            [BookingStatus.EN_ROUTE]: [BookingStatus.ARRIVED_PICKUP],
            [BookingStatus.ARRIVED_PICKUP]: [BookingStatus.PICKED_UP],
            [BookingStatus.PICKED_UP]: [BookingStatus.EN_ROUTE_DROPOFF],
            [BookingStatus.EN_ROUTE_DROPOFF]: [BookingStatus.DELIVERED],
            [BookingStatus.PENDING]: [],
            [BookingStatus.SEARCHING]: [],
            [BookingStatus.OFFERED]: [],
            [BookingStatus.DELIVERED]: [],
            [BookingStatus.CANCELLED]: [],
        };
        if (!validTransitions[this.props.status]?.includes(stage)) {
            throw new Error(`Invalid transition from ${this.props.status} to ${stage}`);
        }
        if (stage === BookingStatus.ARRIVED_PICKUP) {
            this.props.pickup_wait_start = new Date();
        }
        else if (stage === BookingStatus.PICKED_UP &&
            this.props.pickup_wait_start) {
            const waitSec = Math.floor((new Date().getTime() - this.props.pickup_wait_start.getTime()) / 1000);
            this.props.wait_times.pickup_sec = waitSec;
            this.props.pickup_wait_start = null;
        }
        else if (stage === BookingStatus.EN_ROUTE_DROPOFF) {
            this.props.dropoff_wait_start = new Date();
        }
        else if (stage === BookingStatus.DELIVERED &&
            this.props.dropoff_wait_start) {
            const waitSec = Math.floor((new Date().getTime() - this.props.dropoff_wait_start.getTime()) / 1000);
            this.props.wait_times.dropoff_sec = waitSec;
            this.props.dropoff_wait_start = null;
            this.props.can_user_edit = false;
        }
        this.props.status = stage;
        this.props.updated_at = new Date();
    }
    editDetails(updates) {
        if (!this.props.can_user_edit) {
            throw new Error('Cannot edit booking after delivery');
        }
        if (updates.pickup) {
            this.props.pickup = updates.pickup;
        }
        if (updates.dropoffs) {
            this.props.dropoffs = updates.dropoffs;
        }
        if (updates.metadata) {
            this.props.metadata = { ...this.props.metadata, ...updates.metadata };
        }
        this.props.updated_at = new Date();
    }
    cancel(reason) {
        if (this.props.status === BookingStatus.DELIVERED ||
            this.props.status === BookingStatus.CANCELLED) {
            throw new Error('Cannot cancel delivered or already cancelled booking');
        }
        this.props.status = BookingStatus.CANCELLED;
        this.props.metadata.cancel_reason = reason;
        this.props.can_user_edit = false;
        this.props.updated_at = new Date();
    }
    toJSON() {
        return { ...this.props };
    }
}
exports.Booking = Booking;
//# sourceMappingURL=booking.entity.js.map