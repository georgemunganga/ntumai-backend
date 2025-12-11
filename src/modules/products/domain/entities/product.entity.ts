import { Product as PrismaProduct } from '@prisma/client';

export class ProductEntity {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isAvailable: boolean;
  imageUrl?: string;
  stock?: number;

  constructor(data: Partial<ProductEntity>) {
    Object.assign(this, data);
  }
}
