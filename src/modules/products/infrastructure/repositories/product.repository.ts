import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ProductEntity } from '../../domain/entities/product.entity';
import { Product as PrismaProduct } from '@prisma/client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    return product ? this.toDomain(product) : null;
  }

  async save(product: ProductEntity): Promise<ProductEntity> {
    const saved = await this.prisma.product.upsert({
      where: { id: product.id || 'non-existent-id' },
      update: { name: product.name, description: product.description, price: product.price, stock: product.stock },
      create: { id: product.id, name: product.name, description: product.description, price: product.price, stock: product.stock, vendorId: product.vendorId },
    });
    return this.toDomain(saved);
  }

  private toDomain(raw: PrismaProduct): ProductEntity {
    return new ProductEntity({ ...raw, price: raw.price.toNumber() });
  }
}
