import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { BrandRepository } from '../../domain/repositories/brand.repository';
import { Product } from '../../domain/entities/product.entity';
import { ProductDetails } from '../../domain/value-objects/product-details.value-object';
import { Price } from '../../domain/value-objects/price.value-object';
import { Rating } from '../../domain/value-objects/rating.value-object';

export interface ProductSearchFilters {
  categoryId?: string;
  brandId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'price' | 'rating' | 'name' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductCreateData {
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  categoryId: string;
  brandId: string;
  storeId: string;
  sku?: string;
  stock: number;
  minStock?: number;
  imageUrls?: string[];
  tags?: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  isFeatured?: boolean;
  variants?: Array<{
    name: string;
    options: string[];
    additionalPrice?: number;
  }>;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  discountedPrice?: number;
  categoryId?: string;
  brandId?: string;
  stock?: number;
  minStock?: number;
  imageUrls?: string[];
  tags?: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductRecommendation {
  type: 'similar' | 'frequently_bought' | 'trending' | 'personalized';
  products: Product[];
  reason?: string;
}

export interface ProductAnalytics {
  totalViews: number;
  totalSales: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  stockLevel: number;
  reorderPoint: number;
  popularVariants?: Array<{ variant: string; count: number }>;
}

@Injectable()
export class ProductApplicationService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  // Product Creation and Management
  async createProduct(data: ProductCreateData): Promise<Product> {
    // Validate category exists
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate brand exists
    const brand = await this.brandRepository.findById(data.brandId);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Validate SKU uniqueness if provided
    if (data.sku) {
      const existingProduct = await this.productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new BadRequestException('SKU already exists');
      }
    }

    // Create product details value object
    const productDetails = new ProductDetails(
      data.name,
      data.description,
      data.imageUrls || [],
      data.tags || [],
      data.weight,
      data.dimensions,
    );

    // Create price value object
    const price = new Price(
      data.price,
      'USD', // Default currency, should come from config
      data.discountedPrice,
    );

    // Create product entity
    const product = new Product(
      '', // ID will be generated
      productDetails,
      price,
      data.categoryId,
      data.brandId,
      data.storeId,
      data.sku,
      data.stock,
      data.minStock || 0,
      data.isFeatured || false,
      true, // isActive
      new Rating(0, 0), // Initial rating
      new Date(),
      new Date(),
    );

    return await this.productRepository.create(product);
  }

  async updateProduct(id: string, data: ProductUpdateData): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate brand if provided
    if (data.brandId) {
      const brand = await this.brandRepository.findById(data.brandId);
      if (!brand) {
        throw new NotFoundException('Brand not found');
      }
    }

    // Update product properties
    if (data.name !== undefined) {
      product.updateDetails({
        ...product.getDetails(),
        name: data.name,
      });
    }

    if (data.description !== undefined) {
      product.updateDetails({
        ...product.getDetails(),
        description: data.description,
      });
    }

    if (data.price !== undefined) {
      product.updatePrice(new Price(
        data.price,
        product.getPrice().currency,
        data.discountedPrice,
      ));
    }

    if (data.stock !== undefined) {
      product.updateStock(data.stock);
    }

    if (data.isFeatured !== undefined) {
      product.setFeatured(data.isFeatured);
    }

    if (data.isActive !== undefined) {
      if (data.isActive) {
        product.activate();
      } else {
        product.deactivate();
      }
    }

    return await this.productRepository.update(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.delete(id);
  }

  // Product Retrieval
  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count (could be async)
    this.incrementProductViews(id).catch(() => {
      // Log error but don't fail the request
    });

    return product;
  }

  async getProductBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findBySku(sku);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async searchProducts(filters: ProductSearchFilters): Promise<ProductSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { products, total } = await this.productRepository.findWithFilters({
      ...filters,
      offset,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return await this.productRepository.findFeatured(limit);
  }

  async getProductsByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    return await this.productRepository.findByCategory(categoryId, limit);
  }

  async getProductsByBrand(brandId: string, limit: number = 20): Promise<Product[]> {
    return await this.productRepository.findByBrand(brandId, limit);
  }

  async getProductsByStore(storeId: string, limit: number = 20): Promise<Product[]> {
    return await this.productRepository.findByStore(storeId, limit);
  }

  // Product Recommendations
  async getProductRecommendations(productId: string, userId?: string): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    // Similar products (based on category and tags)
    const product = await this.productRepository.findById(productId);
    if (product) {
      const similarProducts = await this.productRepository.findSimilar(productId, 5);
      if (similarProducts.length > 0) {
        recommendations.push({
          type: 'similar',
          products: similarProducts,
          reason: 'Based on category and tags',
        });
      }

      // Frequently bought together
      const frequentlyBought = await this.productRepository.findFrequentlyBoughtTogether(productId, 5);
      if (frequentlyBought.length > 0) {
        recommendations.push({
          type: 'frequently_bought',
          products: frequentlyBought,
          reason: 'Customers who bought this also bought',
        });
      }
    }

    // Trending products
    const trendingProducts = await this.productRepository.findTrending(5);
    if (trendingProducts.length > 0) {
      recommendations.push({
        type: 'trending',
        products: trendingProducts,
        reason: 'Currently trending',
      });
    }

    // Personalized recommendations (if user is provided)
    if (userId) {
      const personalizedProducts = await this.productRepository.findPersonalizedRecommendations(userId, 5);
      if (personalizedProducts.length > 0) {
        recommendations.push({
          type: 'personalized',
          products: personalizedProducts,
          reason: 'Based on your preferences',
        });
      }
    }

    return recommendations;
  }

  // Stock Management
  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.updateStock(quantity);
    return await this.productRepository.update(product);
  }

  async adjustStock(id: string, adjustment: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.getStock() + adjustment;
    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.updateStock(newStock);
    return await this.productRepository.update(product);
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    return await this.productRepository.findLowStock(threshold);
  }

  // Product Analytics
  async getProductAnalytics(id: string): Promise<ProductAnalytics> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // This would typically involve multiple repository calls or a dedicated analytics service
    const analytics = await this.productRepository.getAnalytics(id);
    
    return {
      totalViews: analytics.views || 0,
      totalSales: analytics.sales || 0,
      conversionRate: analytics.views > 0 ? (analytics.sales / analytics.views) * 100 : 0,
      averageRating: product.getRating().average,
      reviewCount: product.getRating().count,
      stockLevel: product.getStock(),
      reorderPoint: product.getMinStock(),
      popularVariants: analytics.popularVariants || [],
    };
  }

  // Helper Methods
  private async incrementProductViews(productId: string): Promise<void> {
    try {
      await this.productRepository.incrementViews(productId);
    } catch (error) {
      // Log error but don't throw
      console.error('Failed to increment product views:', error);
    }
  }

  async bulkUpdatePrices(updates: Array<{ id: string; price: number; discountedPrice?: number }>): Promise<void> {
    await this.productRepository.bulkUpdatePrices(updates);
  }

  async bulkUpdateStock(updates: Array<{ id: string; stock: number }>): Promise<void> {
    await this.productRepository.bulkUpdateStock(updates);
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    return await this.productRepository.findByIds(ids);
  }

  async searchProductsByName(name: string, limit: number = 10): Promise<Product[]> {
    return await this.productRepository.searchByName(name, limit);
  }
}