"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shift = exports.ShiftStatus = void 0;
const nanoid_1 = require("nanoid");
var ShiftStatus;
(function (ShiftStatus) {
    ShiftStatus["ACTIVE"] = "active";
    ShiftStatus["PAUSED"] = "paused";
    ShiftStatus["ENDED"] = "ended";
})(ShiftStatus || (exports.ShiftStatus = ShiftStatus = {}));
class Shift {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(data) {
        const now = new Date();
        return new Shift({
            id: `shf_${(0, nanoid_1.nanoid)(16)}`,
            rider_user_id: data.rider_user_id,
            status: ShiftStatus.ACTIVE,
            vehicle_type: data.vehicle_type,
            start_time: now,
            end_time: null,
            pause_time: null,
            resume_time: null,
            total_pause_duration_sec: 0,
            current_location: data.current_location || null,
            last_location_update: data.current_location ? now : null,
            total_deliveries: 0,
            total_earnings: 0,
            total_distance_km: 0,
            metadata: {},
            created_at: now,
            updated_at: now,
        });
    }
    static fromPersistence(data) {
        return new Shift(data);
    }
    get id() {
        return this.props.id;
    }
    get rider_user_id() {
        return this.props.rider_user_id;
    }
    get status() {
        return this.props.status;
    }
    get vehicle_type() {
        return this.props.vehicle_type;
    }
    get start_time() {
        return this.props.start_time;
    }
    get end_time() {
        return this.props.end_time;
    }
    get current_location() {
        return this.props.current_location;
    }
    get total_deliveries() {
        return this.props.total_deliveries;
    }
    get total_earnings() {
        return this.props.total_earnings;
    }
    get total_distance_km() {
        return this.props.total_distance_km;
    }
    get total_pause_duration_sec() {
        return this.props.total_pause_duration_sec;
    }
    pause() {
        if (this.props.status !== ShiftStatus.ACTIVE) {
            throw new Error('Can only pause an active shift');
        }
        this.props.status = ShiftStatus.PAUSED;
        this.props.pause_time = new Date();
        this.props.updated_at = new Date();
    }
    resume() {
        if (this.props.status !== ShiftStatus.PAUSED) {
            throw new Error('Can only resume a paused shift');
        }
        if (this.props.pause_time) {
            const pauseDuration = Math.floor((new Date().getTime() - this.props.pause_time.getTime()) / 1000);
            this.props.total_pause_duration_sec += pauseDuration;
        }
        this.props.status = ShiftStatus.ACTIVE;
        this.props.resume_time = new Date();
        this.props.pause_time = null;
        this.props.updated_at = new Date();
    }
    end() {
        if (this.props.status === ShiftStatus.ENDED) {
            throw new Error('Shift already ended');
        }
        if (this.props.status === ShiftStatus.PAUSED && this.props.pause_time) {
            const pauseDuration = Math.floor((new Date().getTime() - this.props.pause_time.getTime()) / 1000);
            this.props.total_pause_duration_sec += pauseDuration;
        }
        this.props.status = ShiftStatus.ENDED;
        this.props.end_time = new Date();
        this.props.updated_at = new Date();
    }
    updateLocation(location) {
        this.props.current_location = location;
        this.props.last_location_update = new Date();
        this.props.updated_at = new Date();
    }
    incrementDelivery(earnings, distance_km) {
        this.props.total_deliveries += 1;
        this.props.total_earnings += earnings;
        this.props.total_distance_km += distance_km;
        this.props.updated_at = new Date();
    }
    getDuration() {
        const endTime = this.props.end_time || new Date();
        return Math.floor((endTime.getTime() - this.props.start_time.getTime()) / 1000);
    }
    getActiveDuration() {
        return this.getDuration() - this.props.total_pause_duration_sec;
    }
    isActive() {
        return this.props.status === ShiftStatus.ACTIVE;
    }
    toJSON() {
        return { ...this.props };
    }
}
exports.Shift = Shift;
//# sourceMappingURL=shift.entity.js.map