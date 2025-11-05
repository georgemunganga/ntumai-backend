export declare enum OrderType {
    MARKETPLACE = "marketplace",
    DELIVERY = "delivery"
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface OrderProps {
    id: string;
    user_id: string;
    type: OrderType;
    status: OrderStatus;
    marketplace_order_id: string | null;
    delivery_id: string | null;
    booking_id: string | null;
    total_amount: number;
    currency: string;
    items_summary: string;
    delivery_address: string | null;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}
export declare class Order {
    private props;
    private constructor();
    static fromPersistence(data: OrderProps): Order;
    get id(): string;
    get user_id(): string;
    get type(): OrderType;
    get status(): OrderStatus;
    get total_amount(): number;
    toJSON(): OrderProps;
}
