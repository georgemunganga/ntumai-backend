import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { KafkaProducerService } from '../../../kafka/kafka.producer.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async findById(id: string): Promise<PaymentEntity | null> {
    return this.paymentRepository.findById(id);
  }

  async createPayment(data: Partial<PaymentEntity>): Promise<PaymentEntity> {
    const payment = new PaymentEntity({ ...data, status: PaymentStatus.PENDING });
    return this.paymentRepository.save(payment);
  }

  async processPayment(paymentId: string, transactionId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Simulate payment gateway interaction
    payment.status = PaymentStatus.COMPLETED;
    payment.transactionId = transactionId;

    const completedPayment = await this.paymentRepository.save(payment);

    // Produce Kafka event
    await this.kafkaProducer.sendMessage('payment.completed', completedPayment);

    return completedPayment;
  }
}
