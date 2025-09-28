import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { Product } from '../../domain/entities/product.entity';
import { ProductDetails } from '../../domain/value-objects/product-details.value-object';
import { Price } from '../../domain/value-objects/price.value-object';
import { Rating } from '../../domain/value-objects/rating.value-object';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductRepositoryImpl implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(product: Product): Promise<Product> {
    const data = this.toCreateData(product);
    
    const created = await this.prisma.product.create({
      data,
      include: this.getIncludeOptions(),
    });

    return this.toDomainEntity(created);
  }

  async update(product: Product): Promise<Product> {
    const data = this.toUpdateData(product);
    
    const updated = await this.prisma.product.update({
      where: { id: product.getId() },
      data,
      include: this.getIncludeOptions(),
    });

    return this.toDomainEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.getIncludeOptions(),
    });

    return product ? this.toDomainEntity(product) : null;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: this.getIncludeOptions(),
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: this.getIncludeOptions(),
    });

    return product ? this.toDomainEntity(product) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: this.getIncludeOptions(),
    });

    return product ? this.toDomainEntity(product) : null;
  }

  async findByCategory(categoryId: string, limit?: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { categoryId },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findByBrand(brandId: string, limit?: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { brandId },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findByStore(storeId: string, limit?: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findWithFilters(filters: {
    categoryId?: string;
    brandId?: string;
    storeId?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    isActive?: boolean;
    inStock?: boolean;
    searchQuery?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {};
    
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.inStock) where.stock = { gt: 0 };
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.price = {};
      if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
      if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
    }
    if (filters.rating) {
      where.averageRating = { gte: filters.rating };
    }
    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
        { sku: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          orderBy.name = filters.sortOrder || 'asc';
          break;
        case 'price':
          orderBy.price = filters.sortOrder || 'asc';
          break;
        case 'rating':
          orderBy.averageRating = filters.sortOrder || 'desc';
          break;
        case 'created':
          orderBy.createdAt = filters.sortOrder || 'desc';
          break;
        case 'updated':
          orderBy.updatedAt = filters.sortOrder || 'desc';
          break;
        case 'popularity':
          orderBy.viewCount = filters.sortOrder || 'desc';
          break;
        default:
          orderBy.createdAt = 'desc';
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: this.getIncludeOptions(),
        orderBy,
        skip: filters.offset,
        take: filters.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map(product => this.toDomainEntity(product)),
      total,
    };
  }

  async searchProducts(query: string, limit?: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } },
        ],
        isActive: true,
      },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: [
        { averageRating: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findFeatured(limit?: number): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { featuredAt: 'desc' },
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findRecommended(userId?: string, limit?: number): Promise<Product[]> {
    // Simple recommendation based on popular products
    // In a real implementation, this would use ML algorithms
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
      },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: [
        { averageRating: 'desc' },
        { viewCount: 'desc' },
        { orderCount: 'desc' },
      ],
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async findSimilar(productId: string, limit?: number): Promise<Product[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brandId: true, tags: true },
    });

    if (!product) return [];

    const products = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
          { tags: { hasSome: product.tags } },
        ],
      },
      include: this.getIncludeOptions(),
      take: limit,
      orderBy: { averageRating: 'desc' },
    });

    return products.map(product => this.toDomainEntity(product));
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: quantity },
    });
  }

  async incrementViewCount(productId: string): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async updateRating(productId: string, averageRating: number, reviewCount: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating,
        reviewCount,
      },
    });
  }

  async countByCategory(categoryId: string): Promise<number> {
    return await this.prisma.product.count({
      where: { categoryId },
    });
  }

  async countByCategoryAndStatus(categoryId: string, status: string): Promise<number> {
    return await this.prisma.product.count({
      where: {
        categoryId,
        isActive: status === 'active',
      },
    });
  }

  async updateCategoryForProducts(oldCategoryId: string, newCategoryId: string | null): Promise<void> {
    await this.prisma.product.updateMany({
      where: { categoryId: oldCategoryId },
      data: { categoryId: newCategoryId },
    });
  }

  async getAnalytics(filters: {
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    averagePrice: number;
    averageRating: number;
    totalViews: number;
    topProducts: Array<{
      productId: string;
      name: string;
      views: number;
      orders: number;
      revenue: number;
    }>;
  }> {
    const where: Prisma.ProductWhereInput = {};
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [totalProducts, activeProducts, outOfStockProducts, aggregates, topProducts] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, isActive: true } }),
      this.prisma.product.count({ where: { ...where, stock: 0 } }),
      this.prisma.product.aggregate({
        where,
        _avg: { price: true, averageRating: true },
        _sum: { viewCount: true },
      }),
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          viewCount: true,
          orderCount: true,
          price: true,
        },
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      averagePrice: aggregates._avg.price || 0,
      averageRating: aggregates._avg.averageRating || 0,
      totalViews: aggregates._sum.viewCount || 0,
      topProducts: topProducts.map(product => ({
        productId: product.id,
        name: product.name,
        views: product.viewCount,
        orders: product.orderCount,
        revenue: product.orderCount * product.price,
      })),
    };
  }

  private getIncludeOptions() {
    return {
      category: true,
      brand: true,
      store: true,
      variants: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
    };
  }

  private toCreateData(product: Product): Prisma.ProductCreateInput {
    const details = product.getDetails();
    const price = product.getPrice();
    
    return {
      id: product.getId(),
      name: details.name,
      description: details.description,
      shortDescription: details.shortDescription,
      sku: details.sku,
      slug: product.getSlug(),
      price: price.amount,
      compareAtPrice: price.compareAtPrice,
      currency: price.currency,
      stock: product.getStock(),
      lowStockThreshold: product.getLowStockThreshold(),
      weight: details.weight,
      dimensions: details.dimensions,
      imageUrls: details.imageUrls,
      tags: details.tags,
      metaTitle: details.metaTitle,
      metaDescription: details.metaDescription,
      isActive: product.isActive(),
      isFeatured: product.isFeatured(),
      isDigital: details.isDigital,
      requiresShipping: details.requiresShipping,
      taxable: details.taxable,
      trackQuantity: details.trackQuantity,
      category: product.getCategoryId() ? { connect: { id: product.getCategoryId() } } : undefined,
      brand: product.getBrandId() ? { connect: { id: product.getBrandId() } } : undefined,
      store: { connect: { id: product.getStoreId() } },
      createdAt: product.getCreatedAt(),
      updatedAt: product.getUpdatedAt(),
    };
  }

  private toUpdateData(product: Product): Prisma.ProductUpdateInput {
    const details = product.getDetails();
    const price = product.getPrice();
    
    return {
      name: details.name,
      description: details.description,
      shortDescription: details.shortDescription,
      sku: details.sku,
      slug: product.getSlug(),
      price: price.amount,
      compareAtPrice: price.compareAtPrice,
      currency: price.currency,
      stock: product.getStock(),
      lowStockThreshold: product.getLowStockThreshold(),
      weight: details.weight,
      dimensions: details.dimensions,
      imageUrls: details.imageUrls,
      tags: details.tags,
      metaTitle: details.metaTitle,
      metaDescription: details.metaDescription,
      isActive: product.isActive(),
      isFeatured: product.isFeatured(),
      isDigital: details.isDigital,
      requiresShipping: details.requiresShipping,
      taxable: details.taxable,
      trackQuantity: details.trackQuantity,
      category: product.getCategoryId() ? { connect: { id: product.getCategoryId() } } : { disconnect: true },
      brand: product.getBrandId() ? { connect: { id: product.getBrandId() } } : { disconnect: true },
      updatedAt: product.getUpdatedAt(),
    };
  }

  private toDomainEntity(data: any): Product {
    const details = new ProductDetails(
      data.name,
      data.description,
      data.shortDescription,
      data.sku,
      data.weight,
      data.dimensions,
      data.imageUrls,
      data.tags,
      data.metaTitle,
      data.metaDescription,
      data.isDigital,
      data.requiresShipping,
      data.taxable,
      data.trackQuantity,
    );

    const price = new Price(
      data.price,
      data.currency,
      data.compareAtPrice,
    );

    const rating = new Rating(
      data.averageRating || 0,
      data.reviewCount || 0,
    );

    return Product.reconstitute(
      data.id,
      details,
      price,
      rating,
      data.stock,
      data.lowStockThreshold,
      data.storeId,
      data.categoryId,
      data.brandId,
      data.slug,
      data.isActive,
      data.isFeatured,
      data.viewCount,
      data.orderCount,
      data.featuredAt,
      data.createdAt,
      data.updatedAt,
    );
  }
}