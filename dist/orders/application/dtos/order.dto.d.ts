export declare class GetOrdersQueryDto {
    type?: string;
    status?: string;
    page?: number;
    size?: number;
}
export declare class OrderResponseDto {
    id: string;
    user_id: string;
    type: string;
    status: string;
    marketplace_order_id: string | null;
    delivery_id: string | null;
    booking_id: string | null;
    total_amount: number;
    currency: string;
    items_summary: string;
    delivery_address: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}
export declare class OrdersListResponseDto {
    orders: OrderResponseDto[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
}
