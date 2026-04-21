import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../../../../shared/infrastructure/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../../../../chat/application/services/chat.service';
import { ChatContextTypeDto } from '../../../../chat/application/dtos/chat.dto';
import { NotificationsService } from '../../../../notifications/application/services/notifications.service';
import { TrackingService } from '../../../../tracking/application/services/tracking.service';
import { DeliveryService } from '../../../../deliveries/application/services/delivery.service';

@Injectable()
export class VendorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    private readonly trackingService: TrackingService,
    private readonly deliveryService: DeliveryService,
  ) {}

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

    const [productCount, orderCount, awaitingFulfillmentCount] = await Promise.all([
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
      this.prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'ACCEPTED', 'PREPARING', 'PACKING'],
          },
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
      awaitingFulfillmentCount,
      createdAt: store.createdAt,
    };
  }

  async getStoreReports(
    userId: string,
    storeId: string,
    period: 'week' | 'month' | 'custom' = 'week',
    startDate?: string,
    endDate?: string,
  ) {
    await this.verifyStoreOwnership(userId, storeId);

    const { start, end } = this.resolveReportRange(period, startDate, endDate);
    const completedStatuses = new Set(['DELIVERED', 'COMPLETED']);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        OrderItem: {
          some: {
            Product: {
              storeId,
            },
          },
        },
      },
      include: {
        User: {
          select: {
            id: true,
          },
        },
        OrderItem: {
          where: {
            Product: {
              storeId,
            },
          },
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const productCount = await this.prisma.product.count({ where: { storeId } });

    const orderStatusCounts = new Map<string, number>();
    const customerOrderCounts = new Map<string, number>();
    const topProducts = new Map<
      string,
      {
        productId: string;
        name: string;
        imageUrl?: string | null;
        quantitySold: number;
        revenue: number;
        orderIds: Set<string>;
      }
    >();
    const revenueByDay = new Map<
      string,
      {
        revenue: number;
        orderCount: number;
      }
    >();

    let grossRevenue = 0;
    let completedOrderCount = 0;

    for (const order of orders) {
      const status = String(order.status || 'PENDING');
      orderStatusCounts.set(status, (orderStatusCounts.get(status) || 0) + 1);

      if (order.User?.id) {
        customerOrderCounts.set(
          order.User.id,
          (customerOrderCounts.get(order.User.id) || 0) + 1,
        );
      }

      const itemRevenue = order.OrderItem.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      );

      if (!completedStatuses.has(status)) {
        continue;
      }

      completedOrderCount += 1;
      grossRevenue += itemRevenue;

      const dayKey = this.toUtcDayKey(order.createdAt);
      const revenueDay = revenueByDay.get(dayKey) || { revenue: 0, orderCount: 0 };
      revenueDay.revenue += itemRevenue;
      revenueDay.orderCount += 1;
      revenueByDay.set(dayKey, revenueDay);

      for (const item of order.OrderItem) {
        const productId = item.Product?.id || item.productId;
        if (!productId) {
          continue;
        }

        const aggregate = topProducts.get(productId) || {
          productId,
          name: item.Product?.name || 'Product',
          imageUrl: item.Product?.imageUrl || null,
          quantitySold: 0,
          revenue: 0,
          orderIds: new Set<string>(),
        };

        aggregate.quantitySold += Number(item.quantity || 0);
        aggregate.revenue += Number(item.price || 0) * Number(item.quantity || 0);
        aggregate.orderIds.add(order.id);
        topProducts.set(productId, aggregate);
      }
    }

    const customerCount = customerOrderCounts.size;
    const repeatCustomerCount = Array.from(customerOrderCounts.values()).filter(
      (count) => count > 1,
    ).length;
    const averageOrderValue =
      completedOrderCount > 0 ? grossRevenue / completedOrderCount : 0;

    const revenueTrend = this.buildDailyRevenueTrend(start, end, revenueByDay);

    return {
      period,
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      summary: {
        orderCount: orders.length,
        completedOrderCount,
        grossRevenue,
        averageOrderValue,
        productCount,
        customerCount,
        repeatCustomerCount,
      },
      orderStatusCounts: Array.from(orderStatusCounts.entries()).map(
        ([status, count]) => ({
          status,
          count,
        }),
      ),
      revenueTrend,
      topProducts: Array.from(topProducts.values())
        .map((product) => ({
          productId: product.productId,
          name: product.name,
          imageUrl: product.imageUrl || undefined,
          quantitySold: product.quantitySold,
          revenue: product.revenue,
          orderCount: product.orderIds.size,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  async exportStoreReportsPdf(
    userId: string,
    storeId: string,
    period: 'week' | 'month' | 'custom' = 'week',
    startDate?: string,
    endDate?: string,
  ) {
    const store = await this.verifyStoreOwnership(userId, storeId);
    const reports = await this.getStoreReports(
      userId,
      storeId,
      period,
      startDate,
      endDate,
    );

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const money = (value: number) => `K${Number(value || 0).toFixed(2)}`;

      doc.fontSize(22).text('Ntumai Sales Report', { align: 'left' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#4B5563').text(store.name);
      doc.text(
        `${reports.range.startDate.slice(0, 10)} to ${reports.range.endDate.slice(0, 10)}`,
      );
      doc.text(`Period: ${reports.period}`);
      doc.moveDown();

      doc.fillColor('#111827').fontSize(16).text('Summary');
      doc.moveDown(0.4);
      [
        ['Orders', String(reports.summary.orderCount)],
        ['Completed Orders', String(reports.summary.completedOrderCount)],
        ['Revenue', money(reports.summary.grossRevenue)],
        ['Average Order Value', money(reports.summary.averageOrderValue)],
        ['Products', String(reports.summary.productCount)],
        ['Customers', String(reports.summary.customerCount)],
        ['Repeat Customers', String(reports.summary.repeatCustomerCount)],
      ].forEach(([label, value]) => {
        doc.fontSize(11).text(`${label}: ${value}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Revenue Trend');
      doc.moveDown(0.4);
      reports.revenueTrend.forEach((point) => {
        doc
          .fontSize(11)
          .text(
            `${point.label}: ${money(point.revenue)} across ${point.orderCount} completed orders`,
          );
      });

      doc.moveDown();
      doc.fontSize(16).text('Top Products');
      doc.moveDown(0.4);
      if (reports.topProducts.length === 0) {
        doc.fontSize(11).text('No completed product sales in this period.');
      } else {
        reports.topProducts.forEach((product, index) => {
          doc
            .fontSize(11)
            .text(
              `${index + 1}. ${product.name} - ${product.quantitySold} sold, ${product.orderCount} orders, ${money(product.revenue)}`,
            );
        });
      }

      doc.moveDown();
      doc.fontSize(16).text('Order Status Breakdown');
      doc.moveDown(0.4);
      reports.orderStatusCounts.forEach((item) => {
        doc.fontSize(11).text(`${item.status}: ${item.count}`);
      });

      doc.end();
    });
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
      orders: await Promise.all(
        orders.map(async (order) => ({
          id: order.id,
          trackingId: order.trackingId,
          conversationId: await this.chatService.findExistingConversationId(
            ChatContextTypeDto.MARKETPLACE_ORDER,
            order.id,
          ),
          status: order.status,
          totalAmount: order.totalAmount,
          customer: {
            id: order.User.id,
            name: `${order.User.firstName} ${order.User.lastName}`,
            phone: order.User.phone,
          },
          items: order.OrderItem.map((item) => ({
            id: item.id,
            name: item.Product.name,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress:
            order.Address.address || order.Address.city
              ? `${order.Address.address}, ${order.Address.city}`
              : undefined,
          paymentMethod: undefined,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          tax: order.tax,
          itemCount: order.OrderItem.length,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStoreOrderStatus(
    userId: string,
    storeId: string,
    orderId: string,
    nextStatus: 'ACCEPTED' | 'PREPARING' | 'PACKING' | 'OUT_FOR_DELIVERY',
  ) {
    await this.verifyStoreOwnership(userId, storeId);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OrderItem: {
          some: {
            Product: {
              storeId,
            },
          },
        },
      },
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
        Payment: true,
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new ConflictException('This order can no longer be updated');
    }

    const transitionMap: Record<string, string[]> = {
      PENDING: ['ACCEPTED'],
      ACCEPTED: ['PREPARING'],
      PREPARING: ['PACKING'],
      PACKING: ['OUT_FOR_DELIVERY'],
    };

    const allowed = transitionMap[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${nextStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
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
    });

    let linkedDelivery =
      await this.deliveryService.findLinkedMarketplaceDelivery(orderId);

    if ((nextStatus === 'PACKING' || nextStatus === 'OUT_FOR_DELIVERY') && !linkedDelivery) {
      const vendorAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        select: {
          address: true,
          city: true,
          latitude: true,
          longitude: true,
        },
      });

      if (vendorAddress && updated.Address) {
        linkedDelivery = await this.deliveryService.ensureMarketplaceLinkedDelivery({
          marketplaceOrderId: updated.id,
          storeId,
          customerUserId: updated.userId,
          customerName: `${updated.User.firstName} ${updated.User.lastName}`.trim(),
          customerPhone: updated.User.phone || null,
          storeAddress: vendorAddress,
          customerAddress: {
            address: updated.Address.address,
            city: updated.Address.city,
            latitude: updated.Address.latitude,
            longitude: updated.Address.longitude,
          },
          scheduledAt: updated.scheduledAt,
        });
      }
    }

    if (linkedDelivery && nextStatus === 'OUT_FOR_DELIVERY') {
      await this.trackingService.createEvent({
        booking_id: '',
        delivery_id: linkedDelivery.id,
        event_type: 'en_route_to_dropoff',
      });
    }

    await this.notificationsService.createNotification({
      userId: order.userId,
      title: this.getVendorOrderStatusTitle(nextStatus),
      message: this.getVendorOrderStatusMessage(
        updated.trackingId || updated.id,
        nextStatus,
      ),
      type: 'ORDER_UPDATE',
      metadata: {
        entityType: 'order',
        entityId: updated.id,
        trackingId: updated.trackingId || null,
        sourceStatus: nextStatus,
        statusLabel: this.getVendorOrderStatusLabel(nextStatus),
      },
    });

    return {
      id: updated.id,
      trackingId: updated.trackingId,
      conversationId: await this.chatService.findExistingConversationId(
        ChatContextTypeDto.MARKETPLACE_ORDER,
        updated.id,
      ),
      status: updated.status,
      totalAmount: updated.totalAmount,
      customer: {
        id: updated.User.id,
        name: `${updated.User.firstName} ${updated.User.lastName}`,
        phone: updated.User.phone,
      },
      items: updated.OrderItem.map((item) => ({
        id: item.id,
        name: item.Product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      deliveryAddress:
        updated.Address.address || updated.Address.city
          ? `${updated.Address.address}, ${updated.Address.city}`
          : undefined,
      paymentMethod: undefined,
      subtotal: updated.subtotal,
      deliveryFee: updated.deliveryFee,
      tax: updated.tax,
      itemCount: updated.OrderItem.length,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async cancelStoreOrder(
    userId: string,
    storeId: string,
    orderId: string,
    reason?: string,
  ) {
    await this.verifyStoreOwnership(userId, storeId);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OrderItem: {
          some: {
            Product: {
              storeId,
            },
          },
        },
      },
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
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['PENDING', 'ACCEPTED', 'PREPARING'].includes(order.status)) {
      throw new ConflictException('This order cannot be cancelled at this stage');
    }

    for (const item of order.OrderItem) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
          updatedAt: new Date(),
        },
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
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
        Payment: true,
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    const linkedDelivery =
      await this.deliveryService.findLinkedMarketplaceDelivery(orderId);
    if (linkedDelivery) {
      await this.deliveryService.cancelLinkedMarketplaceDelivery(
        linkedDelivery.id,
        reason || 'Vendor cancelled the order before handoff',
      );
    }

    const refundResult = await this.refundPaidPayments(updated.id);

    await this.notificationsService.createNotification({
      userId: order.userId,
      title: order.status === 'PENDING' ? 'Order rejected' : 'Order cancelled',
      message: refundResult.refunded
        ? `Your order ${updated.trackingId || updated.id} was cancelled by the vendor. K${refundResult.amount.toFixed(2)} has been marked for refund.`
        : order.status === 'PENDING'
          ? `Your order ${updated.trackingId || updated.id} could not be accepted by the vendor.`
          : `Your order ${updated.trackingId || updated.id} was cancelled by the vendor.`,
      type: 'ORDER_UPDATE',
      metadata: {
        entityType: 'order',
        entityId: updated.id,
        trackingId: updated.trackingId || null,
        sourceStatus: 'CANCELLED',
        statusLabel: 'Cancelled',
        notificationType: refundResult.refunded
          ? 'order_cancelled_refund'
          : 'order_cancelled',
        refundAmount: refundResult.refunded ? refundResult.amount : 0,
      },
    });

    return {
      id: updated.id,
      trackingId: updated.trackingId,
      conversationId: await this.chatService.findExistingConversationId(
        ChatContextTypeDto.MARKETPLACE_ORDER,
        updated.id,
      ),
      status: updated.status,
      totalAmount: updated.totalAmount,
      customer: {
        id: updated.User.id,
        name: `${updated.User.firstName} ${updated.User.lastName}`,
        phone: updated.User.phone,
      },
      items: updated.OrderItem.map((item) => ({
        id: item.id,
        name: item.Product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      deliveryAddress:
        updated.Address.address || updated.Address.city
          ? `${updated.Address.address}, ${updated.Address.city}`
          : undefined,
      paymentMethod: undefined,
      subtotal: updated.subtotal,
      deliveryFee: updated.deliveryFee,
      tax: updated.tax,
      itemCount: updated.OrderItem.length,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Helper methods
  private getVendorOrderStatusLabel(status: string) {
    switch (status) {
      case 'ACCEPTED':
        return 'Vendor Confirmed';
      case 'PREPARING':
        return 'Preparing';
      case 'PACKING':
        return 'Ready for Pickup';
      case 'OUT_FOR_DELIVERY':
        return 'On the Way';
      default:
        return status;
    }
  }

  private getVendorOrderStatusTitle(status: string) {
    switch (status) {
      case 'ACCEPTED':
        return 'Order accepted';
      case 'PREPARING':
        return 'Order preparing';
      case 'PACKING':
        return 'Order ready for pickup';
      case 'OUT_FOR_DELIVERY':
        return 'Order handed off';
      default:
        return 'Order update';
    }
  }

  private getVendorOrderStatusMessage(trackingId: string, status: string) {
    switch (status) {
      case 'ACCEPTED':
        return `Your order ${trackingId} has been accepted by the vendor.`;
      case 'PREPARING':
        return `Your order ${trackingId} is now being prepared.`;
      case 'PACKING':
        return `Your order ${trackingId} is ready for pickup.`;
      case 'OUT_FOR_DELIVERY':
        return `Your order ${trackingId} has been handed off for delivery.`;
      default:
        return `Your order ${trackingId} has been updated.`;
    }
  }

  private async refundPaidPayments(orderId: string) {
    const paidPayments = await this.prisma.payment.findMany({
      where: {
        orderId,
        status: 'PAID',
      },
    });

    if (paidPayments.length === 0) {
      return { refunded: false, amount: 0 };
    }

    const totalAmount = paidPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    await this.prisma.payment.updateMany({
      where: {
        orderId,
        status: 'PAID',
      },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date(),
      },
    });

    return {
      refunded: true,
      amount: totalAmount,
    };
  }

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
    let store = await this.prisma.store.findFirst({
      where: { vendorId: userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!store) {
      const assignment = await this.prisma.userRoleAssignment.findUnique({
        where: {
          userId_role: {
            userId,
            role: 'VENDOR',
          },
        },
        select: {
          metadata: true,
        },
      });

      const metadata =
        assignment?.metadata && typeof assignment.metadata === 'object'
          ? (assignment.metadata as Record<string, unknown>)
          : null;
      const onboardingData =
        metadata?.onboardingData &&
        typeof metadata.onboardingData === 'object' &&
        !Array.isArray(metadata.onboardingData)
          ? (metadata.onboardingData as Record<string, unknown>)
          : null;
      const businessName =
        typeof onboardingData?.businessName === 'string'
          ? onboardingData.businessName.trim()
          : '';
      const description =
        typeof onboardingData?.description === 'string'
          ? onboardingData.description.trim()
          : '';

      if (!businessName) {
        throw new NotFoundException('Vendor store not found');
      }

      store = await this.prisma.store.create({
        data: {
          id: uuidv4(),
          vendorId: userId,
          name: businessName,
          description: description || null,
          imageUrl: null,
          isActive: false,
          averageRating: 0,
          updatedAt: new Date(),
        },
      });
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

  private resolveReportRange(
    period: 'week' | 'month' | 'custom',
    startDate?: string,
    endDate?: string,
  ) {
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    if (period === 'custom') {
      const start = startDate ? new Date(startDate) : new Date(end);
      const customEnd = endDate ? new Date(endDate) : new Date(end);

      if (Number.isNaN(start.getTime()) || Number.isNaN(customEnd.getTime())) {
        throw new BadRequestException('Custom report dates must be valid');
      }

      start.setUTCHours(0, 0, 0, 0);
      customEnd.setUTCHours(23, 59, 59, 999);

      if (start > customEnd) {
        throw new BadRequestException('Report start date must be before end date');
      }

      return { start, end: customEnd };
    }

    const start = new Date(end);
    if (period === 'month') {
      start.setUTCDate(start.getUTCDate() - 29);
    } else {
      start.setUTCDate(start.getUTCDate() - 6);
    }
    start.setUTCHours(0, 0, 0, 0);

    return { start, end };
  }

  private buildDailyRevenueTrend(
    start: Date,
    end: Date,
    revenueByDay: Map<string, { revenue: number; orderCount: number }>,
  ) {
    const trend: Array<{
      date: string;
      label: string;
      revenue: number;
      orderCount: number;
    }> = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const dayKey = this.toUtcDayKey(cursor);
      const bucket = revenueByDay.get(dayKey) || { revenue: 0, orderCount: 0 };

      trend.push({
        date: dayKey,
        label: cursor.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          timeZone: 'UTC',
        }),
        revenue: bucket.revenue,
        orderCount: bucket.orderCount,
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return trend;
  }

  private toUtcDayKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }
}
