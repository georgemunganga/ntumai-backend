import { Module } from '@nestjs/common';
import { OrderController } from './interfaces/controllers/order.controller';
import { OrderService } from './application/services/order.service';
import { OrderRepository } from './infrastructure/repositories/order.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, PrismaService],
  exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
