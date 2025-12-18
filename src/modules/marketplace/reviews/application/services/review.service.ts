import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  // Product Reviews
  async createProductReview(
    userId: string,
    productId: string,
    rating: number,
    comment?: string,
    images?: string[],
  ) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
        entityType: 'PRODUCT',
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId,
        entityId: productId,
        entityType: 'PRODUCT',
        productId,
        rating,
        comment,
        images: images || [],
        updatedAt: new Date(),
      },
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
    });

    // Update product average rating
    await this.updateProductRating(productId);

    return this.mapReviewToDto(review);
  }

  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          productId,
          entityType: 'PRODUCT',
        },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          productId,
          entityType: 'PRODUCT',
        },
      }),
    ]);

    return {
      reviews: reviews.map((r) => this.mapReviewToDto(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Store Reviews
  async createStoreReview(
    userId: string,
    storeId: string,
    rating: number,
    comment?: string,
  ) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        storeId,
        entityType: 'STORE',
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this store');
    }

    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId,
        entityId: storeId,
        entityType: 'STORE',
        storeId,
        rating,
        comment,
        updatedAt: new Date(),
      },
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
    });

    // Update store average rating
    await this.updateStoreRating(storeId);

    return this.mapReviewToDto(review);
  }

  async getStoreReviews(storeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          storeId,
          entityType: 'STORE',
        },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          storeId,
          entityType: 'STORE',
        },
      }),
    ]);

    return {
      reviews: reviews.map((r) => this.mapReviewToDto(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Favorites
  async toggleFavorite(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await this.prisma.favorite.delete({
        where: { id: existing.id },
      });

      return {
        isFavorite: false,
        message: 'Removed from favorites',
      };
    } else {
      // Add favorite
      await this.prisma.favorite.create({
        data: {
          id: uuidv4(),
          userId,
          productId,
        },
      });

      return {
        isFavorite: true,
        message: 'Added to favorites',
      };
    }
  }

  async getFavorites(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          Product: {
            include: {
              Store: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites: favorites.map((f) => ({
        id: f.id,
        product: {
          id: f.Product.id,
          name: f.Product.name,
          imageUrl: f.Product.imageUrl,
          price: f.Product.price,
          discountedPrice: f.Product.discountedPrice,
          averageRating: f.Product.averageRating,
          store: f.Product.Store,
        },
        createdAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Wishlist
  async addToWishlist(userId: string, productId: string, note?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });

      return {
        inWishlist: false,
        message: 'Removed from wishlist',
      };
    } else {
      // Add to wishlist
      await this.prisma.wishlist.create({
        data: {
          id: uuidv4(),
          userId,
          productId,
          note,
        },
      });

      return {
        inWishlist: true,
        message: 'Added to wishlist',
      };
    }
  }

  async getWishlist(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [wishlist, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              Store: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wishlist.count({ where: { userId } }),
    ]);

    return {
      wishlist: wishlist.map((w) => ({
        id: w.id,
        product: {
          id: w.product.id,
          name: w.product.name,
          imageUrl: w.product.imageUrl,
          price: w.product.price,
          discountedPrice: w.product.discountedPrice,
          averageRating: w.product.averageRating,
          store: w.product.Store,
        },
        note: w.note,
        createdAt: w.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Helper methods
  private async updateProductRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: {
        productId,
        entityType: 'PRODUCT',
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: result._avg.rating || 0,
        reviewCount: result._count,
        updatedAt: new Date(),
      },
    });
  }

  private async updateStoreRating(storeId: string) {
    const result = await this.prisma.review.aggregate({
      where: {
        storeId,
        entityType: 'STORE',
      },
      _avg: {
        rating: true,
      },
    });

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        averageRating: result._avg.rating || 0,
        updatedAt: new Date(),
      },
    });
  }

  private mapReviewToDto(review: any) {
    return {
      id: review.id,
      user: {
        id: review.User_Review_userIdToUser.id,
        name: `${review.User_Review_userIdToUser.firstName} ${review.User_Review_userIdToUser.lastName}`,
        profileImage: review.User_Review_userIdToUser.profileImage,
      },
      rating: review.rating,
      comment: review.comment,
      images: review.images || [],
      helpfulCount: review.helpfulCount || 0,
      createdAt: review.createdAt,
    };
  }
}
