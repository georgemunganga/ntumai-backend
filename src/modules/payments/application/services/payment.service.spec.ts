import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { KafkaProducerService } from '../../../kafka/kafka.producer.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPaymentRepository: Partial<PaymentRepository>;
  let mockKafkaProducerService: Partial<KafkaProducerService>;

  beforeEach(async () => {
    mockPaymentRepository = {
      findById: jest.fn(),
      save: jest.fn(payment => payment),
    };

    mockKafkaProducerService = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: mockPaymentRepository },
        { provide: KafkaProducerService, useValue: mockKafkaProducerService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create a payment with PENDING status', async () => {
      const paymentData = {
        userId: 'user-1',
        amount: 100.50,
        currency: 'USD',
        method: PaymentMethod.CARD,
      };

      const result = await service.createPayment(paymentData as any);

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });
  });

  describe('processPayment', () => {
    const paymentId = 'pay-1';
    const transactionId = 'txn-1';
    const mockPayment = new PaymentEntity({
      id: paymentId,
      userId: 'user-1',
      amount: 100.50,
      currency: 'USD',
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CARD,
    });

    it('should update status to COMPLETED and send Kafka event', async () => {
      mockPaymentRepository.findById = jest.fn().mockResolvedValue(mockPayment);
      mockPaymentRepository.save = jest.fn(p => ({ ...p, status: PaymentStatus.COMPLETED, transactionId }));

      const result = await service.processPayment(paymentId, transactionId);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.transactionId).toBe(transactionId);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockKafkaProducerService.sendMessage).toHaveBeenCalledWith(
        'payment.completed',
        expect.objectContaining({ id: paymentId, status: PaymentStatus.COMPLETED }),
      );
    });

    it('should throw an error if payment is not found', async () => {
      mockPaymentRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(service.processPayment(paymentId, transactionId)).rejects.toThrow(
        'Payment not found',
      );
    });
  });
});
