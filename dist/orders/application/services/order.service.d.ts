import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { GetOrdersQueryDto, OrderResponseDto, OrdersListResponseDto } from '../dtos/order.dto';
export declare class OrderService {
    private readonly orderRepository;
    constructor(orderRepository: IOrderRepository);
    getOrders(userId: string, query: GetOrdersQueryDto): Promise<OrdersListResponseDto>;
    getOrderById(orderId: string, userId: string): Promise<OrderResponseDto>;
    getOrderByMarketplaceOrderId(marketplaceOrderId: string, userId: string): Promise<OrderResponseDto>;
    getOrderByDeliveryId(deliveryId: string, userId: string): Promise<OrderResponseDto>;
    private toResponseDto;
}
