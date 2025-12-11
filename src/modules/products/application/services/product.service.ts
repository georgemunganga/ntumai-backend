import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../infrastructure/repositories/product.repository';
import { ProductEntity } from '../../domain/entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findById(id: string): Promise<ProductEntity | null> {
    return this.productRepository.findById(id);
  }

  async create(data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = new ProductEntity(data);
    return this.productRepository.save(product);
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    Object.assign(product, data);
    return this.productRepository.save(product);
  }
}
