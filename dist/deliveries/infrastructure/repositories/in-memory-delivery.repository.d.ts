import { IDeliveryRepository, DeliveryFilters, PaginationParams, PaginatedResult } from '../../domain/repositories/delivery.repository.interface';
import { DeliveryOrder } from '../../domain/entities/delivery-order.entity';
export declare class InMemoryDeliveryRepository implements IDeliveryRepository {
    private deliveries;
    create(delivery: DeliveryOrder): Promise<DeliveryOrder>;
    findById(id: string): Promise<DeliveryOrder | null>;
    findAll(filters: DeliveryFilters, pagination: PaginationParams): Promise<PaginatedResult<DeliveryOrder>>;
    update(id: string, updates: Partial<DeliveryOrder>): Promise<DeliveryOrder>;
    delete(id: string): Promise<void>;
    findNearby(lat: number, lng: number, radius_km: number, vehicle_type?: string): Promise<DeliveryOrder[]>;
    private calculateDistance;
    private toRad;
}
