import { Module } from '@nestjs/common';
import { ShiftController } from './presentation/controllers/shift.controller';
import { ShiftService } from './application/services/shift.service';
import { PrismaShiftRepository } from './infrastructure/repositories/prisma-shift.repository';
import { ShiftsGateway } from './infrastructure/websocket/shifts.gateway';
import { SHIFT_REPOSITORY } from './domain/repositories/shift.repository.interface';
import { DatabaseModule } from '../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftController],
  providers: [
    ShiftService,
    ShiftsGateway,
    {
      provide: SHIFT_REPOSITORY,
      useClass: PrismaShiftRepository,
    },
  ],
  exports: [ShiftService, SHIFT_REPOSITORY],
})
export class ShiftsModule {}
