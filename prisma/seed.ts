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
      {
        id: 'seed-vendor-restaurant',
        email: 'restaurant.vendor.seed@example.com',
        phone: '+260970000011',
        firstName: 'Lusaka',
        lastName: 'Kitchen',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-grocery',
        email: 'grocery.vendor.seed@example.com',
        phone: '+260970000012',
        firstName: 'Fresh',
        lastName: 'Mart',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-electronics',
        email: 'electronics.vendor.seed@example.com',
        phone: '+260970000013',
        firstName: 'Tech',
        lastName: 'Hub',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-pharmacy',
        email: 'pharmacy.vendor.seed@example.com',
        phone: '+260970000014',
        firstName: 'Care',
        lastName: 'Pharmacy',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-fashion',
        email: 'fashion.vendor.seed@example.com',
        phone: '+260970000015',
        firstName: 'Style',
        lastName: 'House',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-hardware',
        email: 'hardware.vendor.seed@example.com',
        phone: '+260970000016',
        firstName: 'Build',
        lastName: 'Supply',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-beauty',
        email: 'beauty.vendor.seed@example.com',
        phone: '+260970000017',
        firstName: 'Glow',
        lastName: 'Beauty',
        role: 'VENDOR' as const,
      },
      {
        id: 'seed-vendor-bakery',
        email: 'bakery.vendor.seed@example.com',
        phone: '+260970000018',
        firstName: 'Daily',
        lastName: 'Bakery',
        role: 'VENDOR' as const,
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

      if (user.role === 'VENDOR') {
        await prisma.userRoleAssignment.upsert({
          where: {
            userId_role: {
              userId: user.id,
              role: 'VENDOR',
            },
          },
          update: {
            active: true,
            metadata: { source: 'seed' },
          },
          create: {
            userId: user.id,
            role: 'VENDOR',
            active: true,
            metadata: { source: 'seed' },
          },
        });
      }
    }
    console.log('Demo users seeded');

    // Seed categories
    console.log('Seeding categories...');
    const categories = [
      {
        id: 'cat-1',
        name: 'Electronics',
        iconKey: 'electronics',
        imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-2',
        name: 'Fashion',
        iconKey: 'fashion',
        imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-3',
        name: 'Food & Beverages',
        iconKey: 'food',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-4',
        name: 'Home & Garden',
        iconKey: 'home',
        imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-5',
        name: 'Groceries',
        iconKey: 'groceries',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-6',
        name: 'Restaurants',
        iconKey: 'restaurant',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-7',
        name: 'Pharmacy & Health',
        iconKey: 'health',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-8',
        name: 'Beauty & Personal Care',
        iconKey: 'beauty',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-9',
        name: 'Bakery',
        iconKey: 'bakery',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-10',
        name: 'Fresh Produce',
        iconKey: 'produce',
        imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-11',
        name: 'Hardware',
        iconKey: 'hardware',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-12',
        name: 'Baby & Kids',
        iconKey: 'baby',
        imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-13',
        name: 'Stationery & Office',
        iconKey: 'office',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-14',
        name: 'Pet Supplies',
        iconKey: 'pet',
        imageUrl: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-15',
        name: 'Automotive',
        iconKey: 'automotive',
        imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'cat-16',
        name: 'Gifts & Flowers',
        iconKey: 'gifts',
        imageUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&h=400&fit=crop',
        isActive: true,
        updatedAt: new Date(),
      },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          iconKey: category.iconKey,
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
      {
        id: 'brand-4',
        name: 'Ntumai Essentials',
        imageUrl: 'https://via.placeholder.com/300?text=Essentials',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        id: 'brand-5',
        name: 'Zed Local',
        imageUrl: 'https://via.placeholder.com/300?text=Zed+Local',
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

    console.log('Seeding stores and products...');
    const stores = [
      {
        id: 'store-seed-1',
        name: 'Ntumai Demo Market',
        description: 'Groceries, pantry goods, and household essentials.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-1',
        averageRating: 4.7,
      },
      {
        id: 'store-restaurant-1',
        name: 'Lusaka Kitchen',
        description: 'Local meals, grilled food, nshima plates, and quick lunches.',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-restaurant',
        averageRating: 4.8,
      },
      {
        id: 'store-grocery-1',
        name: 'Fresh Mart Zambia',
        description: 'Fresh produce, meats, dairy, drinks, and pantry staples.',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-grocery',
        averageRating: 4.6,
      },
      {
        id: 'store-electronics-1',
        name: 'Tech Hub Zambia',
        description: 'Phones, accessories, computers, TVs, and electronics.',
        imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-electronics',
        averageRating: 4.5,
      },
      {
        id: 'store-pharmacy-1',
        name: 'CarePlus Pharmacy',
        description: 'Health essentials, wellness products, and personal care.',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-pharmacy',
        averageRating: 4.7,
      },
      {
        id: 'store-fashion-1',
        name: 'Style House',
        description: 'Clothing, shoes, bags, and fashion accessories.',
        imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-fashion',
        averageRating: 4.4,
      },
      {
        id: 'store-hardware-1',
        name: 'Build Supply Hardware',
        description: 'Tools, fittings, paint, repair supplies, and building materials.',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-hardware',
        averageRating: 4.3,
      },
      {
        id: 'store-beauty-1',
        name: 'Glow Beauty Store',
        description: 'Beauty products, skincare, hair care, and grooming essentials.',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-beauty',
        averageRating: 4.6,
      },
      {
        id: 'store-bakery-1',
        name: 'Daily Crust Bakery',
        description: 'Fresh bread, cakes, pastries, and breakfast bakes.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&h=600&fit=crop',
        vendorId: 'seed-vendor-bakery',
        averageRating: 4.9,
      },
    ];

    for (const store of stores) {
      await prisma.store.upsert({
        where: { id: store.id },
        update: {
          name: store.name,
          description: store.description,
          imageUrl: store.imageUrl,
          vendorId: store.vendorId,
          isActive: true,
          averageRating: store.averageRating,
          updatedAt: now,
        },
        create: {
          ...store,
          isActive: true,
          updatedAt: now,
        },
      });
    }

    const products = [
      {
        id: 'product-seed-1',
        storeId: 'store-seed-1',
        name: 'Fresh Tomatoes',
        description: 'Locally sourced tomatoes by the bundle.',
        price: 25,
        discountedPrice: 22,
        discountPercentage: 12,
        stock: 100,
        minStock: 10,
        imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=800&h=800&fit=crop',
        tags: ['fresh', 'vegetables', 'tomatoes', 'groceries'],
        categoryId: 'cat-10',
        brandId: 'brand-3',
      },
      {
        id: 'product-seed-2',
        storeId: 'store-seed-1',
        name: 'Bananas',
        description: 'Sweet ripe bananas, ready to eat.',
        price: 18,
        discountedPrice: null,
        discountPercentage: null,
        stock: 80,
        minStock: 10,
        imageUrl: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800&h=800&fit=crop',
        tags: ['fruit', 'fresh', 'bananas', 'groceries'],
        categoryId: 'cat-10',
        brandId: 'brand-3',
      },
      {
        id: 'product-food-1',
        storeId: 'store-restaurant-1',
        name: 'Chicken Nshima Plate',
        description: 'Grilled chicken served with nshima, relish, and salad.',
        price: 85,
        discountedPrice: 78,
        discountPercentage: 8,
        stock: 40,
        minStock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=800&fit=crop',
        tags: ['food', 'restaurant', 'chicken', 'nshima', 'lunch'],
        categoryId: 'cat-6',
        brandId: 'brand-5',
      },
      {
        id: 'product-food-2',
        storeId: 'store-restaurant-1',
        name: 'Beef Burger Combo',
        description: 'Beef burger with chips and a soft drink.',
        price: 95,
        discountedPrice: null,
        discountPercentage: null,
        stock: 35,
        minStock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=800&fit=crop',
        tags: ['burger', 'food', 'restaurant', 'chips'],
        categoryId: 'cat-6',
        brandId: 'brand-5',
      },
      {
        id: 'product-food-3',
        storeId: 'store-restaurant-1',
        name: 'Vegetable Fried Rice',
        description: 'Vegetable fried rice with fresh herbs and sauce.',
        price: 65,
        discountedPrice: null,
        discountPercentage: null,
        stock: 30,
        minStock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=800&fit=crop',
        tags: ['rice', 'food', 'vegetarian', 'restaurant'],
        categoryId: 'cat-6',
        brandId: 'brand-5',
      },
      {
        id: 'product-grocery-1',
        storeId: 'store-grocery-1',
        name: '2L Cooking Oil',
        description: 'Everyday cooking oil for home kitchens.',
        price: 105,
        discountedPrice: 99,
        discountPercentage: 6,
        stock: 60,
        minStock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&h=800&fit=crop',
        tags: ['groceries', 'oil', 'pantry', 'cooking'],
        categoryId: 'cat-5',
        brandId: 'brand-4',
      },
      {
        id: 'product-grocery-2',
        storeId: 'store-grocery-1',
        name: 'Long Grain Rice 5kg',
        description: 'Premium long grain rice for family meals.',
        price: 150,
        discountedPrice: null,
        discountPercentage: null,
        stock: 50,
        minStock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop',
        tags: ['rice', 'groceries', 'pantry'],
        categoryId: 'cat-5',
        brandId: 'brand-4',
      },
      {
        id: 'product-electronics-1',
        storeId: 'store-electronics-1',
        name: 'Bluetooth Earbuds',
        description: 'Wireless earbuds with charging case.',
        price: 420,
        discountedPrice: 380,
        discountPercentage: 10,
        stock: 25,
        minStock: 4,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop',
        tags: ['electronics', 'earbuds', 'audio', 'phone accessories'],
        categoryId: 'cat-1',
        brandId: 'brand-1',
      },
      {
        id: 'product-electronics-2',
        storeId: 'store-electronics-1',
        name: 'USB-C Fast Charger',
        description: 'Fast charging wall adapter with USB-C cable.',
        price: 180,
        discountedPrice: null,
        discountPercentage: null,
        stock: 40,
        minStock: 6,
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop',
        tags: ['electronics', 'charger', 'phone', 'accessories'],
        categoryId: 'cat-1',
        brandId: 'brand-1',
      },
      {
        id: 'product-pharmacy-1',
        storeId: 'store-pharmacy-1',
        name: 'Vitamin C Tablets',
        description: 'Immune support vitamin C tablets.',
        price: 95,
        discountedPrice: null,
        discountPercentage: null,
        stock: 45,
        minStock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=800&fit=crop',
        tags: ['pharmacy', 'health', 'vitamins', 'wellness'],
        categoryId: 'cat-7',
        brandId: 'brand-4',
      },
      {
        id: 'product-pharmacy-2',
        storeId: 'store-pharmacy-1',
        name: 'First Aid Kit',
        description: 'Home first aid kit with essential medical supplies.',
        price: 260,
        discountedPrice: 240,
        discountPercentage: 8,
        stock: 20,
        minStock: 4,
        imageUrl: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800&h=800&fit=crop',
        tags: ['pharmacy', 'health', 'first aid', 'medical'],
        categoryId: 'cat-7',
        brandId: 'brand-4',
      },
      {
        id: 'product-fashion-1',
        storeId: 'store-fashion-1',
        name: 'Casual Sneakers',
        description: 'Everyday sneakers for casual wear.',
        price: 520,
        discountedPrice: 470,
        discountPercentage: 10,
        stock: 18,
        minStock: 3,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
        tags: ['fashion', 'shoes', 'sneakers'],
        categoryId: 'cat-2',
        brandId: 'brand-2',
      },
      {
        id: 'product-fashion-2',
        storeId: 'store-fashion-1',
        name: 'Leather Handbag',
        description: 'Stylish handbag for work and weekends.',
        price: 650,
        discountedPrice: null,
        discountPercentage: null,
        stock: 14,
        minStock: 3,
        imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop',
        tags: ['fashion', 'bag', 'handbag', 'accessories'],
        categoryId: 'cat-2',
        brandId: 'brand-2',
      },
      {
        id: 'product-hardware-1',
        storeId: 'store-hardware-1',
        name: 'Cordless Drill',
        description: 'Rechargeable drill for repairs and installations.',
        price: 980,
        discountedPrice: 920,
        discountPercentage: 6,
        stock: 12,
        minStock: 2,
        imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=800&fit=crop',
        tags: ['hardware', 'tools', 'drill', 'repair'],
        categoryId: 'cat-11',
        brandId: 'brand-4',
      },
      {
        id: 'product-hardware-2',
        storeId: 'store-hardware-1',
        name: 'Interior Paint 5L',
        description: 'Durable interior wall paint.',
        price: 340,
        discountedPrice: null,
        discountPercentage: null,
        stock: 30,
        minStock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=800&fit=crop',
        tags: ['hardware', 'paint', 'home', 'renovation'],
        categoryId: 'cat-11',
        brandId: 'brand-4',
      },
      {
        id: 'product-beauty-1',
        storeId: 'store-beauty-1',
        name: 'Shea Body Lotion',
        description: 'Moisturising body lotion for daily skincare.',
        price: 120,
        discountedPrice: 105,
        discountPercentage: 13,
        stock: 35,
        minStock: 6,
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop',
        tags: ['beauty', 'skincare', 'lotion'],
        categoryId: 'cat-8',
        brandId: 'brand-4',
      },
      {
        id: 'product-beauty-2',
        storeId: 'store-beauty-1',
        name: 'Hair Care Kit',
        description: 'Shampoo, conditioner, and treatment kit.',
        price: 210,
        discountedPrice: null,
        discountPercentage: null,
        stock: 22,
        minStock: 4,
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop',
        tags: ['beauty', 'hair', 'personal care'],
        categoryId: 'cat-8',
        brandId: 'brand-4',
      },
      {
        id: 'product-bakery-1',
        storeId: 'store-bakery-1',
        name: 'Sourdough Bread',
        description: 'Freshly baked sourdough loaf.',
        price: 55,
        discountedPrice: null,
        discountPercentage: null,
        stock: 28,
        minStock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=800&fit=crop',
        tags: ['bakery', 'bread', 'fresh'],
        categoryId: 'cat-9',
        brandId: 'brand-5',
      },
      {
        id: 'product-bakery-2',
        storeId: 'store-bakery-1',
        name: 'Chocolate Cupcakes 6 Pack',
        description: 'Box of six chocolate cupcakes.',
        price: 120,
        discountedPrice: 105,
        discountPercentage: 13,
        stock: 24,
        minStock: 4,
        imageUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&h=800&fit=crop',
        tags: ['bakery', 'cake', 'cupcakes', 'dessert'],
        categoryId: 'cat-9',
        brandId: 'brand-5',
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          ...product,
          isActive: true,
          averageRating: 4.5,
          reviewCount: 12,
          updatedAt: now,
        },
        create: {
          ...product,
          isActive: true,
          averageRating: 4.5,
          reviewCount: 12,
          updatedAt: now,
        },
      });
    }
    console.log('Stores and products seeded');

    console.log('Seeding marketplace promotions...');
    const promotions = [
      {
        id: 'promo-seed-free-delivery',
        title: 'Free Delivery Weekend',
        description: 'Free delivery on selected marketplace orders.',
        type: 'FREE_DELIVERY' as const,
        value: 0,
        isActive: true,
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'promo-seed-market-discount',
        title: 'Marketplace Deals',
        description: 'Save on food, groceries, and essentials.',
        type: 'DISCOUNT' as const,
        value: 15,
        isActive: true,
        startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const promotion of promotions) {
      await prisma.promotion.upsert({
        where: { id: promotion.id },
        update: {
          ...promotion,
          updatedAt: now,
        },
        create: {
          ...promotion,
          updatedAt: now,
        },
      });
    }
    console.log('Marketplace promotions seeded');

    console.log('Seeding support ticket coverage...');
    const supportTickets = [
      {
        id: 'support-seed-account',
        category: 'ACCOUNT' as const,
        subject: 'Account verification help',
        description: 'Seed support ticket for account-related support flows.',
      },
      {
        id: 'support-seed-order',
        category: 'ORDER' as const,
        subject: 'Order status follow-up',
        description: 'Seed support ticket for order support flows.',
      },
      {
        id: 'support-seed-payment',
        category: 'PAYMENT' as const,
        subject: 'Payment confirmation issue',
        description: 'Seed support ticket for payment support flows.',
      },
      {
        id: 'support-seed-delivery',
        category: 'DELIVERY' as const,
        subject: 'Delivery route support',
        description: 'Seed support ticket for delivery support flows.',
      },
      {
        id: 'support-seed-onboarding',
        category: 'ONBOARDING' as const,
        subject: 'Vendor onboarding question',
        description: 'Seed support ticket for onboarding support flows.',
      },
      {
        id: 'support-seed-technical',
        category: 'TECHNICAL' as const,
        subject: 'App technical issue',
        description: 'Seed support ticket for technical support flows.',
      },
      {
        id: 'support-seed-general',
        category: 'GENERAL' as const,
        subject: 'General help request',
        description: 'Seed support ticket for general support flows.',
      },
    ];

    for (const ticket of supportTickets) {
      await prisma.supportTicket.upsert({
        where: { id: ticket.id },
        update: {
          userId: 'seed-customer-1',
          category: ticket.category,
          subject: ticket.subject,
          description: ticket.description,
          status: 'OPEN',
          updatedAt: now,
        },
        create: {
          ...ticket,
          userId: 'seed-customer-1',
          status: 'OPEN',
          updatedAt: now,
        },
      });
    }
    console.log('Support ticket coverage seeded');

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
