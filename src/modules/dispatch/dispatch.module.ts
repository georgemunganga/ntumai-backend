import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { PricingModule } from '../pricing/pricing.module';
import { DispatchService } from './application/services/dispatch.service';

@Module({
  imports: [DatabaseModule, PricingModule],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
