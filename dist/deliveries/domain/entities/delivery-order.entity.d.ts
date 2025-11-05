import { Stop } from './stop.entity';
import { Attachment } from './attachment.entity';
export declare enum OrderStatus {
    BOOKED = "booked",
    DELIVERY = "delivery"
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
export interface PaymentInfo {
    method: PaymentMethod | null;
    calc_payload: any | null;
    calc_sig: string | null;
    currency: string | null;
    amount: number | null;
    expires_at: Date | null;
}
export declare class DeliveryOrder {
    readonly id: string;
    readonly created_by_user_id: string;
    readonly placed_by_role: string;
    vehicle_type: VehicleType;
    courier_comment: string | null;
    is_scheduled: boolean;
    scheduled_at: Date | null;
    order_status: OrderStatus;
    payment: PaymentInfo;
    stops: Stop[];
    attachments: Attachment[];
    more_info: string | null;
    rider_id: string | null;
    ready_token: string | null;
    ready_token_expires_at: Date | null;
    readonly created_at: Date;
    updated_at: Date;
    constructor(id: string, created_by_user_id: string, placed_by_role: string, vehicle_type: VehicleType, courier_comment: string | null, is_scheduled: boolean, scheduled_at: Date | null, order_status: OrderStatus, payment: PaymentInfo, stops: Stop[], attachments: Attachment[], more_info: string | null, rider_id: string | null, ready_token: string | null, ready_token_expires_at: Date | null, created_at: Date, updated_at: Date);
    static create(params: {
        id: string;
        created_by_user_id: string;
        placed_by_role: string;
        vehicle_type: VehicleType;
        courier_comment?: string;
        is_scheduled?: boolean;
        scheduled_at?: Date;
        more_info?: string;
    }): DeliveryOrder;
    addStop(stop: Stop): void;
    removeStop(stopId: string): void;
    updateStop(stopId: string, updates: Partial<Stop>): void;
    reorderStops(stopIds: string[]): void;
    attachPricing(calc_payload: any, calc_sig: string, currency: string, amount: number, expires_at: Date): void;
    setPaymentMethod(method: PaymentMethod): void;
    setReadyToken(token: string, expiresAt: Date): void;
    assignRider(riderId: string): void;
    markAsDelivery(): void;
    isPricingValid(): boolean;
    isReadyTokenValid(): boolean;
    canSubmit(): boolean;
}
