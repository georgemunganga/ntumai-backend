import { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';

export class OrderEntity {
  id: string;
  customerId: string;
  vendorId: string;
  taskId: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  items: PrismaOrderItem[];

  constructor(data: Partial<OrderEntity>) {
    Object.assign(this, data);
  }
}
