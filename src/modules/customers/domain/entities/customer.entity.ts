import { Customer as PrismaCustomer, Address as PrismaAddress } from '@prisma/client';

export class CustomerEntity {
  id: string;
  userId: string;
  defaultAddress?: string;
  preferences?: any;
  addresses: PrismaAddress[];

  constructor(data: Partial<CustomerEntity>) {
    Object.assign(this, data);
  }
}
