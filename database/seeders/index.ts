import { PrismaClient } from '@prisma/client';
import { seedUserRoles } from './user-roles.seeder';
import { seedAddresses } from './addresses.seeder';

const prisma = new PrismaClient();

async function runAllSeeders() {
  console.log('🚀 Starting database seeding process...');
  console.log('=' .repeat(50));

  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Run seeders in order
    console.log('\n1️⃣ Seeding user roles and sample users...');
    const users = await seedUserRoles();
    console.log('✅ User roles and sample users seeded successfully');

    console.log('\n2️⃣ Seeding sample addresses...');
    const addresses = await seedAddresses();
    console.log('✅ Sample addresses seeded successfully');

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All seeders completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   👥 Users created: ${Object.keys(users).length}`);
    console.log(`   🏠 Addresses created: ${addresses.customerAddresses.length + addresses.vendorAddresses.length + 1}`);
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Admin: admin@ntumai.com / Admin@123456');
    console.log('   Customer: customer@example.com / Customer@123');
    console.log('   Driver: driver@example.com / Driver@123');
    console.log('   Vendor: vendor@example.com / Vendor@123');
    console.log('\n⚠️  Remember to change default passwords in production!');

  } catch (error) {
    console.error('\n💥 Seeding process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Export individual seeders for selective running
export {
  seedUserRoles,
  seedAddresses,
  runAllSeeders,
};

// Run all seeders if called directly
if (require.main === module) {
  runAllSeeders()
    .then(() => {
      console.log('\n✨ Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database seeding failed:', error);
      process.exit(1);
    });
}