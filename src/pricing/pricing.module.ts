import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PricingController } from './presentation/controllers/pricing.controller';
import { PricingCalculatorService } from './application/services/pricing-calculator.service';
import { SignatureService } from './infrastructure/crypto/signature.service';
import { InMemoryRateTableRepository } from './infrastructure/repositories/in-memory-rate-table.repository';
import { RATE_TABLE_REPOSITORY } from './domain/repositories/rate-table.repository.interface';

@Module({
  imports: [ConfigModule],
  controllers: [PricingController],
  providers: [
    PricingCalculatorService,
    SignatureService,
    {
      provide: RATE_TABLE_REPOSITORY,
      useClass: InMemoryRateTableRepository,
    },
  ],
  exports: [PricingCalculatorService, SignatureService],
})
export class PricingModule {}
