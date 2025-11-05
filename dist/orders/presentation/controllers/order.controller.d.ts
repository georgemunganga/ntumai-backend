import { OrderService } from '../../application/services/order.service';
import { GetOrdersQueryDto, OrderResponseDto, OrdersListResponseDto } from '../../application/dtos/order.dto';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    getOrders(req: any, query: GetOrdersQueryDto): Promise<OrdersListResponseDto>;
    getOrderById(req: any, orderId: string): Promise<OrderResponseDto>;
    getOrderByMarketplaceOrderId(req: any, marketplaceOrderId: string): Promise<OrderResponseDto>;
    getOrderByDeliveryId(req: any, deliveryId: string): Promise<OrderResponseDto>;
}
