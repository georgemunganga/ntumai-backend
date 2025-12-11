import { Module } from '@nestjs/common';
import { PaymentController } from './interfaces/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PrismaService],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentsModule {}
