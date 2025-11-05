import { Module } from '@nestjs/common';
import { OrderController } from './presentation/controllers/order.controller';
import { OrderService } from './application/services/order.service';
import { PrismaOrderRepository } from './infrastructure/repositories/prisma-order.repository';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { DatabaseModule } from '../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [OrderService, ORDER_REPOSITORY],
})
export class OrdersModule {}
