import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import {
  GetOrdersQueryDto,
  OrderResponseDto,
  OrdersListResponseDto,
} from '../dtos/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async getOrders(
    userId: string,
    query: GetOrdersQueryDto,
  ): Promise<OrdersListResponseDto> {
    const page = query.page || 1;
    const size = query.size || 20;

    const { orders, total } = await this.orderRepository.findByUserId(userId, {
      type: query.type,
      status: query.status,
      page,
      size,
    });

    const totalPages = Math.ceil(total / size);

    return {
      orders: orders.map((order) => this.toResponseDto(order)),
      total,
      page,
      size,
      total_pages: totalPages,
    };
  }

  async getOrderById(
    orderId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponseDto(order);
  }

  async getOrderByMarketplaceOrderId(
    marketplaceOrderId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    const order =
      await this.orderRepository.findByMarketplaceOrderId(marketplaceOrderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponseDto(order);
  }

  async getOrderByDeliveryId(
    deliveryId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByDeliveryId(deliveryId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponseDto(order);
  }

  private toResponseDto(order: Order): OrderResponseDto {
    const data = order.toJSON();
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type,
      status: data.status,
      marketplace_order_id: data.marketplace_order_id,
      delivery_id: data.delivery_id,
      booking_id: data.booking_id,
      total_amount: data.total_amount,
      currency: data.currency,
      items_summary: data.items_summary,
      delivery_address: data.delivery_address,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString(),
      completed_at: data.completed_at?.toISOString() || null,
    };
  }
}
