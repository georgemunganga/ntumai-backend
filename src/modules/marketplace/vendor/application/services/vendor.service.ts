import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultBusinessHours = [
    { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' },
    { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '20:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '22:00' },
  ];

  private readonly productCategoryPresets: Record<
    string,
    {
      categoryNames: string[];
      subcategories: Array<{ key: string; label: string; iconKey?: string }>;
    }
  > = {
    restaurant: {
      categoryNames: ['Restaurants', 'Food & Beverages'],
      subcategories: [
        { key: 'main_dishes', label: 'Main Dishes', iconKey: 'utensils' },
        { key: 'snacks', label: 'Snacks', iconKey: 'cookie' },
        { key: 'beverages', label: 'Beverages', iconKey: 'cup-soda' },
        { key: 'desserts', label: 'Desserts', iconKey: 'ice-cream' },
        { key: 'combos', label: 'Combos', iconKey: 'package' },
      ],
    },
    grocery: {
      categoryNames: ['Groceries', 'Fresh Produce'],
      subcategories: [
        { key: 'fresh_produce', label: 'Fresh Produce', iconKey: 'apple' },
        { key: 'pantry', label: 'Pantry Staples', iconKey: 'package' },
        { key: 'drinks', label: 'Drinks', iconKey: 'cup-soda' },
        { key: 'dairy', label: 'Dairy & Eggs', iconKey: 'milk' },
        { key: 'household', label: 'Household', iconKey: 'home' },
      ],
    },
    pharmacy: {
      categoryNames: ['Pharmacy & Health'],
      subcategories: [
        { key: 'medicine', label: 'Medicine', iconKey: 'pill' },
        { key: 'vitamins', label: 'Vitamins', iconKey: 'capsule' },
        { key: 'first_aid', label: 'First Aid', iconKey: 'cross' },
        { key: 'personal_care', label: 'Personal Care', iconKey: 'heart' },
        { key: 'baby_care', label: 'Baby Care', iconKey: 'baby' },
      ],
    },
    bakery: {
      categoryNames: ['Bakery', 'Food & Beverages'],
      subcategories: [
        { key: 'bread', label: 'Bread', iconKey: 'sandwich' },
        { key: 'cakes', label: 'Cakes', iconKey: 'cake' },
        { key: 'pastries', label: 'Pastries', iconKey: 'croissant' },
        { key: 'cookies', label: 'Cookies', iconKey: 'cookie' },
        { key: 'drinks', label: 'Drinks', iconKey: 'cup-soda' },
      ],
    },
    electronics: {
      categoryNames: ['Electronics'],
      subcategories: [
        { key: 'phones', label: 'Phones', iconKey: 'smartphone' },
        { key: 'computers', label: 'Computers', iconKey: 'laptop' },
        { key: 'accessories', label: 'Accessories', iconKey: 'headphones' },
        { key: 'appliances', label: 'Appliances', iconKey: 'monitor' },
        { key: 'gaming', label: 'Gaming', iconKey: 'gamepad-2' },
      ],
    },
    fashion: {
      categoryNames: ['Fashion'],
      subcategories: [
        { key: 'mens_wear', label: "Men's Wear", iconKey: 'shirt' },
        { key: 'womens_wear', label: "Women's Wear", iconKey: 'shirt' },
        { key: 'shoes', label: 'Shoes', iconKey: 'footprints' },
        { key: 'bags', label: 'Bags', iconKey: 'briefcase' },
        { key: 'accessories', label: 'Accessories', iconKey: 'sparkles' },
      ],
    },
    wholesale: {
      categoryNames: ['Groceries', 'Home & Garden', 'Stationery & Office'],
      subcategories: [
        { key: 'bulk_food', label: 'Bulk Food', iconKey: 'package' },
        { key: 'cleaning', label: 'Cleaning Supplies', iconKey: 'spray-can' },
        { key: 'office', label: 'Office Supplies', iconKey: 'clipboard' },
        { key: 'packaging', label: 'Packaging', iconKey: 'box' },
        { key: 'general_merchandise', label: 'General Merchandise', iconKey: 'store' },
      ],
    },
    other: {
      categoryNames: ['Food & Beverages', 'Groceries', 'Electronics', 'Fashion'],
      subcategories: [
        { key: 'featured', label: 'Featured', iconKey: 'star' },
        { key: 'popular', label: 'Popular', iconKey: 'trending-up' },
        { key: 'essentials', label: 'Essentials', iconKey: 'package' },
      ],
    },
  };

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

  async getMyStoreBusinessHours(userId: string) {
    const store = await this.getVendorStore(userId);
    await this.ensureDefaultBusinessHours(store.id);

    const [hours, holidays] = await Promise.all([
      (this.prisma as any).storeBusinessHour.findMany({
        where: { storeId: store.id },
        orderBy: { dayOfWeek: 'asc' },
      }),
      (this.prisma as any).storeHoliday.findMany({
        where: { storeId: store.id },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      storeId: store.id,
      timezone: 'Africa/Lusaka',
      isCurrentlyOpen: this.calculateIsCurrentlyOpen(hours, holidays),
      autoOffline: Boolean((store as any).autoOffline),
      hours: hours.map((hour: any) => ({
        day: hour.dayOfWeek,
        isOpen: hour.isOpen,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
      holidays: holidays.map((holiday: any) => ({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date,
        isRecurring: holiday.isRecurring,
      })),
    };
  }

  async updateMyStoreBusinessHours(userId: string, payload: any) {
    const store = await this.getVendorStore(userId);
    const hours = Array.isArray(payload?.hours) ? payload.hours : [];
    const holidays = Array.isArray(payload?.holidays) ? payload.holidays : [];

    if (hours.length !== 7) {
      throw new BadRequestException('Business hours must include all 7 days');
    }

    const normalizedHours = hours.map((hour: any) => {
      const day = Number(hour.day ?? hour.dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new BadRequestException('Each business day must be between 0 and 6');
      }

      const openTime = String(hour.openTime || '');
      const closeTime = String(hour.closeTime || '');
      this.validateTime(openTime, 'openTime');
      this.validateTime(closeTime, 'closeTime');

      if (hour.isOpen !== false && openTime >= closeTime) {
        throw new BadRequestException('Open time must be before close time');
      }

      return {
        dayOfWeek: day,
        isOpen: Boolean(hour.isOpen),
        openTime,
        closeTime,
      };
    });

    const uniqueDays = new Set(normalizedHours.map((hour) => hour.dayOfWeek));
    if (uniqueDays.size !== 7) {
      throw new BadRequestException('Business hours must include each day once');
    }

    const normalizedHolidays = holidays.map((holiday: any) => {
      const name = String(holiday.name || '').trim();
      const date = new Date(holiday.date);

      if (!name) {
        throw new BadRequestException('Holiday name is required');
      }

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('Holiday date must be valid');
      }

      return {
        id: holiday.id || uuidv4(),
        name,
        date,
        isRecurring: Boolean(holiday.isRecurring),
      };
    });

    await this.prisma.$transaction([
      this.prisma.store.update({
        where: { id: store.id },
        data: {
          autoOffline: Boolean(payload?.autoOffline),
          updatedAt: new Date(),
        } as any,
      }),
      (this.prisma as any).storeBusinessHour.deleteMany({
        where: { storeId: store.id },
      }),
      (this.prisma as any).storeHoliday.deleteMany({
        where: { storeId: store.id },
      }),
      (this.prisma as any).storeBusinessHour.createMany({
        data: normalizedHours.map((hour) => ({
          id: uuidv4(),
          storeId: store.id,
          ...hour,
          updatedAt: new Date(),
        })),
      }),
      ...(normalizedHolidays.length
        ? [
            (this.prisma as any).storeHoliday.createMany({
              data: normalizedHolidays.map((holiday) => ({
                ...holiday,
                storeId: store.id,
                updatedAt: new Date(),
              })),
            }),
          ]
        : []),
    ]);

    return this.getMyStoreBusinessHours(userId);
  }

  async getMyProductCategoryOptions(userId: string) {
    const [store, assignment, categories] = await Promise.all([
      this.getVendorStore(userId),
      this.prisma.userRoleAssignment.findUnique({
        where: {
          userId_role: {
            userId,
            role: 'VENDOR',
          },
        },
        select: {
          metadata: true,
        },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          iconKey: true,
        },
      }),
    ]);

    const metadata =
      assignment?.metadata &&
      typeof assignment.metadata === 'object' &&
      !Array.isArray(assignment.metadata)
        ? (assignment.metadata as Record<string, unknown>)
        : {};
    const onboardingData =
      metadata.onboardingData &&
      typeof metadata.onboardingData === 'object' &&
      !Array.isArray(metadata.onboardingData)
        ? (metadata.onboardingData as Record<string, unknown>)
        : {};
    const businessType =
      typeof onboardingData.businessType === 'string'
        ? onboardingData.businessType
        : 'Other';
    const preset = this.getProductCategoryPreset(businessType);
    const preferredCategories = categories.filter((category) =>
      preset.categoryNames.includes(category.name),
    );

    return {
      storeId: store.id,
      businessType,
      categories:
        preferredCategories.length > 0
          ? preferredCategories
          : categories.slice(0, 6),
      suggestedSubcategories: preset.subcategories,
      allowCustomSubcategory: true,
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
        subcategory: this.normalizeSubcategory(productData.subcategory),
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
      subcategory: product.subcategory,
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
        ...(Object.prototype.hasOwnProperty.call(updateData, 'subcategory')
          ? {
              subcategory: this.normalizeSubcategory(updateData.subcategory),
            }
          : {}),
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      subcategory: updated.subcategory,
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

  private async getVendorStore(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { vendorId: userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!store) {
      throw new NotFoundException('Vendor store not found');
    }

    return store;
  }

  private async ensureDefaultBusinessHours(storeId: string) {
    const existingCount = await (this.prisma as any).storeBusinessHour.count({
      where: { storeId },
    });

    if (existingCount > 0) {
      return;
    }

    await (this.prisma as any).storeBusinessHour.createMany({
      data: this.defaultBusinessHours.map((hour) => ({
        id: uuidv4(),
        storeId,
        ...hour,
        updatedAt: new Date(),
      })),
    });
  }

  private validateTime(value: string, field: string) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(`${field} must use HH:MM format`);
    }
  }

  private calculateIsCurrentlyOpen(hours: any[], holidays: any[]) {
    const now = new Date();
    const day = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    const isHoliday = holidays.some((holiday) => {
      const date = new Date(holiday.date);
      if (holiday.isRecurring) {
        return (
          date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
        );
      }

      return date.toDateString() === now.toDateString();
    });

    if (isHoliday) {
      return false;
    }

    const todaysHours = hours.find((hour) => hour.dayOfWeek === day);
    if (!todaysHours?.isOpen) {
      return false;
    }

    return (
      currentTime >= todaysHours.openTime && currentTime <= todaysHours.closeTime
    );
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

  private getProductCategoryPreset(businessType?: string) {
    const normalized = String(businessType || 'other').trim().toLowerCase();
    return (
      this.productCategoryPresets[normalized] ||
      this.productCategoryPresets.other
    );
  }

  private normalizeSubcategory(value: unknown) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
