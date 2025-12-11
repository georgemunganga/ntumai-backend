import { Payment as PrismaPayment, PaymentStatus, PaymentMethod } from '@prisma/client';

export class PaymentEntity {
  id: string;
  userId: string;
  orderId?: string;
  taskId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;

  constructor(data: Partial<PaymentEntity>) {
    Object.assign(this, data);
  }
}
