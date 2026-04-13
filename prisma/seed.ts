import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Starting database seeding...');

  try {
    const now = new Date();
    const password = await hash('password123', 10);

    console.log('Seeding demo users...');
    const users = [
      {
        id: 'seed-customer-1',
        email: 'customer.seed@example.com',
        phone: '+260970000001',
        firstName: 'Seed',
        lastName: 'Customer',
        role: 'CUSTOMER' as const,
      },
      {
        id: 'seed-vendor-1',
        email: 'vendor.seed@example.com',
        phone: '+260970000002',
        firstName: 'Seed',
        lastName: 'Vendor',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-driver-1',
        email: 'driver.seed@example.com',
        phone: '+260970000003',
        firstName: 'Seed',
        lastName: 'Driver',
        role: 'DRIVER' as const,
      },
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          updatedAt: now,
        },
        create: {
          ...user,
          password,
          isEmailVerified: true,
          isPhoneVerified: true,
          updatedAt: now,
        },
      });
    }
    console.log('Demo users seeded');

    // Seed categories
    console.log('Seeding categories...');
    const categories = [
      {
        id: 'cat-1',
        name: 'Electronics',
        imageUrl: 'https://via.placeholder.com/300?text=Electronics',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Clothing',
        imageUrl: 'https://via.placeholder.com/300?text=Clothing',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        name: 'Food & Beverages',
        imageUrl: 'https://via.placeholder.com/300?text=Food',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-4',
        name: 'Home & Garden',
        imageUrl: 'https://via.placeholder.com/300?text=Home',
        isActive: true,
        updatedAt: new Date(),
      },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          updatedAt: category.updatedAt,
        },
        create: category,
      });
    }
    console.log('Categories seeded');

    // Seed brands
    console.log('Seeding brands...');
    const brands = [
      {
        id: 'brand-1',
        name: 'TechPro',
        imageUrl: 'https://via.placeholder.com/300?text=TechPro',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'brand-2',
        name: 'StyleMax',
        imageUrl: 'https://via.placeholder.com/300?text=StyleMax',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'brand-3',
        name: 'FreshFoods',
        imageUrl: 'https://via.placeholder.com/300?text=FreshFoods',
        isActive: true,
        updatedAt: new Date(),
      },
    ];

    for (const brand of brands) {
      await prisma.brand.upsert({
        where: { id: brand.id },
        update: {
          name: brand.name,
          imageUrl: brand.imageUrl,
          isActive: brand.isActive,
          updatedAt: brand.updatedAt,
        },
        create: brand,
      });
    }
    console.log('Brands seeded');

    console.log('Seeding store and products...');
    await prisma.store.upsert({
      where: { id: 'store-seed-1' },
      update: {
        name: 'Ntumai Demo Market',
        description: 'Seed store for mobile API integration testing',
        imageUrl: 'https://via.placeholder.com/600?text=Ntumai+Market',
        vendorId: 'seed-vendor-1',
        isActive: true,
        averageRating: 4.7,
        updatedAt: now,
      },
      create: {
        id: 'store-seed-1',
        name: 'Ntumai Demo Market',
        description: 'Seed store for mobile API integration testing',
        imageUrl: 'https://via.placeholder.com/600?text=Ntumai+Market',
        vendorId: 'seed-vendor-1',
        isActive: true,
        averageRating: 4.7,
        updatedAt: now,
      },
    });

    const products = [
      {
        id: 'product-seed-1',
        name: 'Fresh Tomatoes',
        description: 'Locally sourced tomatoes',
        price: 25,
        discountedPrice: 22,
        discountPercentage: 12,
        stock: 100,
        minStock: 10,
        imageUrl: 'https://via.placeholder.com/600?text=Tomatoes',
        tags: ['fresh', 'vegetables'],
        categoryId: 'cat-3',
        brandId: 'brand-3',
      },
      {
        id: 'product-seed-2',
        name: 'Bananas',
        description: 'Sweet ripe bananas',
        price: 18,
        discountedPrice: null,
        discountPercentage: null,
        stock: 80,
        minStock: 10,
        imageUrl: 'https://via.placeholder.com/600?text=Bananas',
        tags: ['fruit', 'fresh'],
        categoryId: 'cat-3',
        brandId: 'brand-3',
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          ...product,
          storeId: 'store-seed-1',
          isActive: true,
          averageRating: 4.5,
          reviewCount: 12,
          updatedAt: now,
        },
        create: {
          ...product,
          storeId: 'store-seed-1',
          isActive: true,
          averageRating: 4.5,
          reviewCount: 12,
          updatedAt: now,
        },
      });
    }
    console.log('Store and products seeded');

    console.log('Seeding dispatch, shift, and tracking samples...');
    await prisma.shift.upsert({
      where: { id: 'shift-seed-1' },
      update: {
        rider_user_id: 'seed-driver-1',
        status: 'active',
        vehicle_type: 'motorcycle',
        start_time: now,
        current_location: { latitude: -15.3875, longitude: 28.3228 },
        last_location_update: now,
        metadata: { source: 'seed' },
      },
      create: {
        id: 'shift-seed-1',
        rider_user_id: 'seed-driver-1',
        status: 'active',
        vehicle_type: 'motorcycle',
        start_time: now,
        current_location: { latitude: -15.3875, longitude: 28.3228 },
        last_location_update: now,
        metadata: { source: 'seed' },
      },
    });

    await prisma.booking.upsert({
      where: { booking_id: 'booking-seed-1' },
      update: {
        delivery_id: 'delivery-seed-1',
        status: 'searching',
        vehicle_type: 'motorcycle',
        pickup: {
          address: 'Demo Pickup, Lusaka',
          latitude: -15.3875,
          longitude: 28.3228,
        },
        dropoffs: [
          {
            address: 'Demo Dropoff, Lusaka',
            latitude: -15.391,
            longitude: 28.329,
          },
        ],
        rider: { userId: 'seed-driver-1', name: 'Seed Driver' },
        offer: { amount: 45, currency: 'ZMW' },
        wait_times: { pickupSeconds: 0, dropoffSeconds: 0 },
        customer_user_id: 'seed-customer-1',
        customer_name: 'Seed Customer',
        customer_phone: '+260970000001',
        metadata: { source: 'seed' },
      },
      create: {
        booking_id: 'booking-seed-1',
        delivery_id: 'delivery-seed-1',
        status: 'searching',
        vehicle_type: 'motorcycle',
        pickup: {
          address: 'Demo Pickup, Lusaka',
          latitude: -15.3875,
          longitude: 28.3228,
        },
        dropoffs: [
          {
            address: 'Demo Dropoff, Lusaka',
            latitude: -15.391,
            longitude: 28.329,
          },
        ],
        rider: { userId: 'seed-driver-1', name: 'Seed Driver' },
        offer: { amount: 45, currency: 'ZMW' },
        wait_times: { pickupSeconds: 0, dropoffSeconds: 0 },
        customer_user_id: 'seed-customer-1',
        customer_name: 'Seed Customer',
        customer_phone: '+260970000001',
        metadata: { source: 'seed' },
      },
    });

    await prisma.trackingEvent.upsert({
      where: { id: 'tracking-seed-1' },
      update: {
        booking_id: 'booking-seed-1',
        delivery_id: 'delivery-seed-1',
        event_type: 'booking_created',
        location: { latitude: -15.3875, longitude: 28.3228 },
        rider_user_id: 'seed-driver-1',
        metadata: { source: 'seed' },
        timestamp: now,
      },
      create: {
        id: 'tracking-seed-1',
        booking_id: 'booking-seed-1',
        delivery_id: 'delivery-seed-1',
        event_type: 'booking_created',
        location: { latitude: -15.3875, longitude: 28.3228 },
        rider_user_id: 'seed-driver-1',
        metadata: { source: 'seed' },
        timestamp: now,
      },
    });
    console.log('Dispatch, shift, and tracking samples seeded');

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
