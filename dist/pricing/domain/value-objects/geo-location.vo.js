"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoLocation = void 0;
class GeoLocation {
    lat;
    lng;
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
        this.validate();
    }
    validate() {
        if (this.lat < -90 || this.lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (this.lng < -180 || this.lng > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }
    }
    distanceTo(other) {
        const R = 6371;
        const dLat = this.toRad(other.lat - this.lat);
        const dLng = this.toRad(other.lng - this.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(this.lat)) *
                Math.cos(this.toRad(other.lat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return (degrees * Math.PI) / 180;
    }
    toString() {
        return `${this.lat},${this.lng}`;
    }
}
exports.GeoLocation = GeoLocation;
//# sourceMappingURL=geo-location.vo.js.map