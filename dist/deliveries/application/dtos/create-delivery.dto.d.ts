export declare enum StopType {
    PICKUP = "pickup",
    DROPOFF = "dropoff"
}
export declare enum VehicleType {
    MOTORBIKE = "motorbike",
    BICYCLE = "bicycle",
    WALKING = "walking",
    TRUCK = "truck"
}
export declare enum PaymentMethod {
    CASH_ON_DELIVERY = "cash_on_delivery",
    MOBILE_MONEY = "mobile_money",
    CARD = "card",
    WALLET = "wallet",
    BANK_TRANSFER = "bank_transfer"
}
export declare class GeoDto {
    lat: number;
    lng: number;
}
export declare class AddressDto {
    line1?: string;
    line2?: string;
    city: string;
    province?: string;
    country: string;
    postal_code?: string;
}
export declare class CreateStopDto {
    type: StopType;
    sequence: number;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
    geo?: GeoDto;
    address?: AddressDto;
}
export declare class CreateDeliveryDto {
    vehicle_type: VehicleType;
    courier_comment?: string;
    is_scheduled?: boolean;
    scheduled_at?: string;
    more_info?: string;
    stops: CreateStopDto[];
    marketplace_order_id?: string;
    store_id?: string;
}
export declare class AttachPricingDto {
    calc_payload: any;
    calc_sig: string;
}
export declare class SetPaymentMethodDto {
    method: PaymentMethod;
}
export declare class UpdateDeliveryDto {
    vehicle_type?: VehicleType;
    courier_comment?: string;
    is_scheduled?: boolean;
    scheduled_at?: string;
    more_info?: string;
}
export declare class ReorderStopsDto {
    order: string[];
}
export declare class CancelDeliveryDto {
    reason: string;
}
export declare class AcceptDeliveryDto {
    estimated_pickup_time?: string;
}
