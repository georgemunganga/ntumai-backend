import { Module } from '@nestjs/common';
import { CustomerController } from './interfaces/controllers/customer.controller';
import { CustomerService } from './application/services/customer.service';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository, PrismaService],
  exports: [CustomerService, CustomerRepository],
})
export class CustomersModule {}
