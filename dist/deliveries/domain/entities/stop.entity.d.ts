export declare enum StopType {
    PICKUP = "pickup",
    DROPOFF = "dropoff"
}
export interface GeoCoordinates {
    lat: number;
    lng: number;
}
export interface Address {
    line1?: string;
    line2?: string;
    city: string;
    province?: string;
    country: string;
    postal_code?: string;
}
export declare class Stop {
    readonly id: string;
    type: StopType;
    sequence: number;
    contact_name: string | null;
    contact_phone: string | null;
    notes: string | null;
    geo: GeoCoordinates | null;
    address: Address | null;
    completed_at: Date | null;
    proof_photo_id: string | null;
    constructor(id: string, type: StopType, sequence: number, contact_name: string | null, contact_phone: string | null, notes: string | null, geo: GeoCoordinates | null, address: Address | null, completed_at?: Date | null, proof_photo_id?: string | null);
    private validate;
    static create(params: {
        id: string;
        type: StopType;
        sequence: number;
        contact_name?: string;
        contact_phone?: string;
        notes?: string;
        geo?: GeoCoordinates;
        address?: Address;
    }): Stop;
    markCompleted(proofPhotoId?: string): void;
    isCompleted(): boolean;
}
