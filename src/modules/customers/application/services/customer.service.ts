import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';
import { CustomerEntity } from '../../domain/entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findById(id: string): Promise<CustomerEntity | null> {
    return this.customerRepository.findById(id);
  }

  async findByUserId(userId: string): Promise<CustomerEntity | null> {
    return this.customerRepository.findByUserId(userId);
  }

  async create(userId: string): Promise<CustomerEntity> {
    const customer = new CustomerEntity({ userId });
    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<CustomerEntity>): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    Object.assign(customer, data);
    return this.customerRepository.save(customer);
  }
}
