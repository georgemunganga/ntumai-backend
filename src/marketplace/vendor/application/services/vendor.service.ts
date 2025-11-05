import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  // Store Management
  async createStore(userId: string, storeData: any) {
    // Check if user already has a store
    const existingStore = await this.prisma.store.findFirst({
      where: { vendorId: userId },
    });

    if (existingStore) {
      throw new ConflictException('User already owns a store');
    }

    const store = await this.prisma.store.create({
      data: {
        id: uuidv4(),
        vendorId: userId,
        name: storeData.name,
        description: storeData.description,
        imageUrl: storeData.imageUrl,
        isActive: true,
        averageRating: 0,
        updatedAt: new Date(),
      },
    });

    return {
      id: store.id,
      name: store.name,
      description: store.description,
      imageUrl: store.imageUrl,
      isActive: store.isActive,
    };
  }

  async updateStore(userId: string, storeId: string, updateData: any) {
    await this.verifyStoreOwnership(userId, storeId);

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      imageUrl: updated.imageUrl,
      isActive: updated.isActive,
    };
  }

  async pauseStore(userId: string, storeId: string, paused: boolean) {
    await this.verifyStoreOwnership(userId, storeId);

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        isActive: !paused,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: paused ? 'Store paused' : 'Store activated',
    };
  }

  async getStoreAdmin(userId: string, storeId: string) {
    const store = await this.verifyStoreOwnership(userId, storeId);

    const [productCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.order.count({
        where: {
          OrderItem: {
            some: {
              Product: {
                storeId,
              },
            },
          },
        },
      }),
    ]);

    return {
      id: store.id,
      name: store.name,
      description: store.description,
      imageUrl: store.imageUrl,
      isActive: store.isActive,
      averageRating: store.averageRating,
      productCount,
      orderCount,
      createdAt: store.createdAt,
    };
  }

  // Product Management
  async createProduct(userId: string, storeId: string, productData: any) {
    await this.verifyStoreOwnership(userId, storeId);

    const product = await this.prisma.product.create({
      data: {
        id: uuidv4(),
        storeId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        discountedPrice: productData.discountedPrice,
        discountPercentage: productData.discountPercentage,
        stock: productData.stock || 0,
        minStock: productData.minStock || 0,
        imageUrl: productData.imageUrl,
        tags: productData.tags || [],
        categoryId: productData.categoryId,
        brandId: productData.brandId,
        isActive: true,
        averageRating: 0,
        reviewCount: 0,
        updatedAt: new Date(),
      },
    });

    // Create variants if provided
    if (productData.variants && productData.variants.length > 0) {
      await this.prisma.productVariant.createMany({
        data: productData.variants.map((v: any) => ({
          id: uuidv4(),
          productId: product.id,
          name: v.name,
          value: v.value,
          price: v.price,
          stock: v.stock || 0,
          updatedAt: new Date(),
        })),
      });
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    };
  }

  async updateProduct(
    userId: string,
    storeId: string,
    productId: string,
    updateData: any,
  ) {
    await this.verifyProductOwnership(userId, storeId, productId);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      isActive: updated.isActive,
    };
  }

  async updateProductPricing(
    userId: string,
    storeId: string,
    productId: string,
    pricingData: any,
  ) {
    await this.verifyProductOwnership(userId, storeId, productId);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        price: pricingData.price,
        discountedPrice: pricingData.discountedPrice,
        discountPercentage: pricingData.discountPercentage,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      price: updated.price,
      discountedPrice: updated.discountedPrice,
      discountPercentage: updated.discountPercentage,
    };
  }

  async updateProductInventory(
    userId: string,
    storeId: string,
    productId: string,
    inventoryData: any,
  ) {
    await this.verifyProductOwnership(userId, storeId, productId);

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: inventoryData.stockQuantity,
        minStock: inventoryData.minStock,
        isActive: inventoryData.isInStock !== false,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      stock: updated.stock,
      minStock: updated.minStock,
      isActive: updated.isActive,
    };
  }

  async deleteProduct(userId: string, storeId: string, productId: string) {
    await this.verifyProductOwnership(userId, storeId, productId);

    // Soft delete by marking as inactive
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async uploadProductMedia(
    userId: string,
    storeId: string,
    productId: string,
    imageUrl: string,
  ) {
    await this.verifyProductOwnership(userId, storeId, productId);

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl,
        updatedAt: new Date(),
      },
    });

    return {
      imageUrl,
    };
  }

  async getStoreOrders(
    userId: string,
    storeId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    await this.verifyStoreOwnership(userId, storeId);

    const skip = (page - 1) * limit;
    const where: any = {
      OrderItem: {
        some: {
          Product: {
            storeId,
          },
        },
      },
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          OrderItem: {
            where: {
              Product: {
                storeId,
              },
            },
            include: {
              Product: true,
            },
          },
          Address: true,
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        trackingId: order.trackingId,
        status: order.status,
        totalAmount: order.totalAmount,
        customer: {
          name: `${order.User.firstName} ${order.User.lastName}`,
          phone: order.User.phone,
        },
        items: order.OrderItem.map((item) => ({
          product: item.Product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: {
          address: order.Address.address,
          city: order.Address.city,
        },
        createdAt: order.createdAt,
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
  private async verifyStoreOwnership(userId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.vendorId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    return store;
  }

  private async verifyProductOwnership(
    userId: string,
    storeId: string,
    productId: string,
  ) {
    await this.verifyStoreOwnership(userId, storeId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.storeId !== storeId) {
      throw new ForbiddenException('Product does not belong to this store');
    }

    return product;
  }
}
