"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stop = exports.StopType = void 0;
var StopType;
(function (StopType) {
    StopType["PICKUP"] = "pickup";
    StopType["DROPOFF"] = "dropoff";
})(StopType || (exports.StopType = StopType = {}));
class Stop {
    id;
    type;
    sequence;
    contact_name;
    contact_phone;
    notes;
    geo;
    address;
    completed_at;
    proof_photo_id;
    constructor(id, type, sequence, contact_name, contact_phone, notes, geo, address, completed_at = null, proof_photo_id = null) {
        this.id = id;
        this.type = type;
        this.sequence = sequence;
        this.contact_name = contact_name;
        this.contact_phone = contact_phone;
        this.notes = notes;
        this.geo = geo;
        this.address = address;
        this.completed_at = completed_at;
        this.proof_photo_id = proof_photo_id;
        this.validate();
    }
    validate() {
        if (!this.geo && !this.address) {
            throw new Error('Stop must have either geo coordinates or address');
        }
    }
    static create(params) {
        return new Stop(params.id, params.type, params.sequence, params.contact_name || null, params.contact_phone || null, params.notes || null, params.geo || null, params.address || null);
    }
    markCompleted(proofPhotoId) {
        this.completed_at = new Date();
        this.proof_photo_id = proofPhotoId || null;
    }
    isCompleted() {
        return this.completed_at !== null;
    }
}
exports.Stop = Stop;
//# sourceMappingURL=stop.entity.js.map