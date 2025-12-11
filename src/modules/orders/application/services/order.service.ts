import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../infrastructure/repositories/order.repository';
import { OrderEntity } from '../../domain/entities/order.entity';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async findUserOrders(userId: string): Promise<OrderEntity[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.orderRepository.findById(id);
  }

  async create(data: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = new OrderEntity(data);
    return this.orderRepository.save(order);
  }

  async update(id: string, data: Partial<OrderEntity>): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    Object.assign(order, data);
    return this.orderRepository.save(order);
  }
}
