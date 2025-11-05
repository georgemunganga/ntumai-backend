import { DeliveryOrder } from '../entities/delivery-order.entity';
export interface DeliveryFilters {
    created_by_user_id?: string;
    rider_id?: string;
    placed_by_role?: string;
    vehicle_type?: string;
    order_status?: string;
    from?: Date;
    to?: Date;
    near_lat?: number;
    near_lng?: number;
    radius_km?: number;
}
export interface PaginationParams {
    page: number;
    size: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}
export interface IDeliveryRepository {
    create(delivery: DeliveryOrder): Promise<DeliveryOrder>;
    findById(id: string): Promise<DeliveryOrder | null>;
    findAll(filters: DeliveryFilters, pagination: PaginationParams): Promise<PaginatedResult<DeliveryOrder>>;
    update(id: string, updates: Partial<DeliveryOrder>): Promise<DeliveryOrder>;
    delete(id: string): Promise<void>;
    findNearby(lat: number, lng: number, radius_km: number, vehicle_type?: string): Promise<DeliveryOrder[]>;
}
export declare const DELIVERY_REPOSITORY: unique symbol;
