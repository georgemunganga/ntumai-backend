import type { IDeliveryRepository } from '../../domain/repositories/delivery.repository.interface';
import { DeliveryOrder } from '../../domain/entities/delivery-order.entity';
import { CreateDeliveryDto, AttachPricingDto, SetPaymentMethodDto } from '../dtos/create-delivery.dto';
import { PricingCalculatorService } from '../../../pricing/application/services/pricing-calculator.service';
export declare class DeliveryService {
    private readonly deliveryRepository;
    private readonly pricingService;
    constructor(deliveryRepository: IDeliveryRepository, pricingService: PricingCalculatorService);
    createDelivery(dto: CreateDeliveryDto, userId: string, userRole: string): Promise<DeliveryOrder>;
    attachPricing(deliveryId: string, dto: AttachPricingDto, userId: string): Promise<DeliveryOrder>;
    setPaymentMethod(deliveryId: string, dto: SetPaymentMethodDto, userId: string): Promise<DeliveryOrder>;
    preflight(deliveryId: string, userId: string): Promise<{
        ready: boolean;
        ready_token: string;
        expires_at: string;
    }>;
    submitDelivery(deliveryId: string, readyToken: string, userId: string, idempotencyKey?: string): Promise<DeliveryOrder>;
    getMyDeliveries(userId: string, role: string, page?: number, size?: number): Promise<any>;
    getNearbyDeliveries(lat: number, lng: number, radius_km: number, vehicle_type?: string): Promise<DeliveryOrder[]>;
    acceptDelivery(deliveryId: string, riderId: string): Promise<DeliveryOrder>;
    markAsDelivery(deliveryId: string, riderId: string): Promise<DeliveryOrder>;
    cancelDelivery(deliveryId: string, userId: string, reason: string): Promise<DeliveryOrder>;
    getDeliveryById(deliveryId: string): Promise<DeliveryOrder>;
    getConfig(): any;
    private validateStops;
    private validateScheduling;
}
