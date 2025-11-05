import { DeliveryService } from '../../application/services/delivery.service';
import { CreateDeliveryDto, AttachPricingDto, SetPaymentMethodDto, CancelDeliveryDto, AcceptDeliveryDto } from '../../application/dtos/create-delivery.dto';
export declare class DeliveryController {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    createDelivery(dto: CreateDeliveryDto, req: any): Promise<any>;
    attachPricing(id: string, dto: AttachPricingDto, req: any): Promise<any>;
    setPaymentMethod(id: string, dto: SetPaymentMethodDto, req: any): Promise<any>;
    preflight(id: string, req: any): Promise<any>;
    submitDelivery(id: string, readyToken: string, idempotencyKey: string, req: any): Promise<any>;
    getDelivery(id: string): Promise<any>;
    listDeliveries(req: any, role?: string, page?: number, size?: number): Promise<any>;
    cancelDelivery(id: string, dto: CancelDeliveryDto, req: any): Promise<any>;
    getVehicleTypes(): Promise<any>;
    getPaymentMethods(): Promise<any>;
    getDeliveryLimits(): Promise<any>;
}
export declare class RiderDeliveryController {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    getNearbyDeliveries(lat: number, lng: number, radius?: number, vehicleType?: string): Promise<any>;
    acceptDelivery(id: string, dto: AcceptDeliveryDto, req: any): Promise<any>;
    markAsDelivery(id: string, req: any): Promise<any>;
}
