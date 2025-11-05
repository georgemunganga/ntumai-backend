import { Module } from '@nestjs/common';
import { PaymentController } from './presentation/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';
import {
  PAYMENT_INTENT_REPOSITORY,
  PAYMENT_SESSION_REPOSITORY,
  PAYMENT_METHOD_REPOSITORY,
} from './domain/repositories/payment.repository.interface';
import {
  InMemoryPaymentIntentRepository,
  InMemoryPaymentSessionRepository,
  InMemoryPaymentMethodRepository,
} from './infrastructure/repositories/in-memory-payment.repository';
import { CashOnDeliveryAdapter } from './infrastructure/adapters/cash-on-delivery.adapter';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PricingModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    CashOnDeliveryAdapter,
    {
      provide: PAYMENT_INTENT_REPOSITORY,
      useClass: InMemoryPaymentIntentRepository,
    },
    {
      provide: PAYMENT_SESSION_REPOSITORY,
      useClass: InMemoryPaymentSessionRepository,
    },
    {
      provide: PAYMENT_METHOD_REPOSITORY,
      useClass: InMemoryPaymentMethodRepository,
    },
  ],
  exports: [PaymentService],
})
export class PaymentsModule {}
