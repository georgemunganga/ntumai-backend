import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { Payment as PrismaPayment } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    return payment ? this.toDomain(payment) : null;
  }

  async save(payment: PaymentEntity): Promise<PaymentEntity> {
    const saved = await this.prisma.payment.upsert({
      where: { id: payment.id || 'non-existent-id' },
      update: { ...payment, amount: payment.amount },
      create: { ...payment, amount: payment.amount },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaPayment): PaymentEntity {
    return new PaymentEntity({ ...raw, amount: raw.amount.toNumber() });
  }
}
