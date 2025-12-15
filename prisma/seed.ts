import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed user roles
    console.log('📝 Seeding user roles...');
    
    // Note: User roles are typically managed through the auth module
    // This is a placeholder for initial data seeding

    // Seed categories
    console.log('📁 Seeding categories...');
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
        update: {},
        create: category,
      });
    }
    console.log('✅ Categories seeded');

    // Seed brands
    console.log('🏢 Seeding brands...');
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
        update: {},
        create: brand,
      });
    }
    console.log('✅ Brands seeded');

    // Seed delivery statuses (if needed)
    console.log('🚚 Seeding delivery data...');
    // This would depend on your specific delivery model structure

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
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
