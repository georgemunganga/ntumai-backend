import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // Categories
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
      productCount: cat._count.Product,
    }));
  }

  async getCategoryProducts(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ) {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating') orderBy = { averageRating: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        include: {
          Store: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: { categoryId, isActive: true },
      }),
    ]);

    return {
      products: products.map((p) => this.mapProductToDto(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Brands
  async getBrands() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      logoUrl: brand.imageUrl,
      productCount: brand._count.Product,
    }));
  }

  async getBrandProducts(
    brandId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ) {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating') orderBy = { averageRating: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          brandId,
          isActive: true,
        },
        include: {
          Store: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: { brandId, isActive: true },
      }),
    ]);

    return {
      products: products.map((p) => this.mapProductToDto(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Products
  async searchProducts(
    query: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ) {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating') orderBy = { averageRating: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        include: {
          Store: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
      }),
    ]);

    return {
      products: products.map((p) => this.mapProductToDto(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProduct(productId: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        Store: {
          select: { id: true, name: true, imageUrl: true, averageRating: true },
        },
        Brand: {
          select: { id: true, name: true, imageUrl: true },
        },
        Category: {
          select: { id: true, name: true },
        },
        ProductVariant: true,
        Review: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            User_Review_userIdToUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if favorited by user
    let isFavorite = false;
    if (userId) {
      const favorite = await this.prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      isFavorite = !!favorite;
    }

    // Get related products
    const relatedProducts = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        isActive: true,
      },
      include: {
        Store: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      take: 6,
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      imageUrl: product.imageUrl,
      tags: product.tags,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      store: product.Store,
      brand: product.Brand,
      category: product.Category,
      variants: product.ProductVariant || [],
      reviews: product.Review?.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          name: `${r.User_Review_userIdToUser.firstName} ${r.User_Review_userIdToUser.lastName}`,
          profileImage: r.User_Review_userIdToUser.profileImage,
        },
      })),
      isFavorite,
      relatedProducts: relatedProducts.map((p) => this.mapProductToDto(p)),
    };
  }

  // Stores
  async getStores(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { Product: true },
          },
        },
        orderBy: { averageRating: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({
        where: { isActive: true },
      }),
    ]);

    return {
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        imageUrl: s.imageUrl,
        averageRating: s.averageRating,
        productCount: s._count.Product,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: { Product: true },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return {
      id: store.id,
      name: store.name,
      description: store.description,
      imageUrl: store.imageUrl,
      averageRating: store.averageRating,
      productCount: store._count.Product,
      isActive: store.isActive,
    };
  }

  async getStoreProducts(
    storeId: string,
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest',
  ) {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating') orderBy = { averageRating: 'desc' };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          storeId,
          isActive: true,
        },
        include: {
          Store: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({
        where: { storeId, isActive: true },
      }),
    ]);

    return {
      products: products.map((p) => this.mapProductToDto(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private mapProductToDto(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountedPrice: product.discountedPrice,
      discountPercentage: product.discountPercentage,
      imageUrl: product.imageUrl,
      rating: product.averageRating,
      reviewCount: product.reviewCount,
      store: product.Store,
      isFavorite: false, // Will be set by controller if user is authenticated
    };
  }
}
