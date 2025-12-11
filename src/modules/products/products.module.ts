import { Module } from '@nestjs/common';
import { ProductController } from './interfaces/controllers/product.controller';
import { ProductService } from './application/services/product.service';
import { ProductRepository } from './infrastructure/repositories/product.repository';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, PrismaService],
  exports: [ProductService, ProductRepository],
})
export class ProductsModule {}
