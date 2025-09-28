import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedUserRoles() {
  console.log('🌱 Seeding user roles and admin account...');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ntumai.com' },
      update: {},
      create: {
        email: 'admin@ntumai.com',
        phone: '+1234567890',
        firstName: 'System',
        lastName: 'Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: new Date(),
      },
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create sample customer
    const customerPassword = await bcrypt.hash('Customer@123', 12);
    
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        phone: '+1987654321',
        firstName: 'John',
        lastName: 'Doe',
        password: customerPassword,
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Customer user created:', customerUser.email);

    // Create sample driver
    const driverPassword = await bcrypt.hash('Driver@123', 12);
    
    const driverUser = await prisma.user.upsert({
      where: { email: 'driver@example.com' },
      update: {},
      create: {
        email: 'driver@example.com',
        phone: '+1555666777',
        firstName: 'Mike',
        lastName: 'Wilson',
        password: driverPassword,
        role: UserRole.DRIVER,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Driver user created:', driverUser.email);

    // Create sample vendor
    const vendorPassword = await bcrypt.hash('Vendor@123', 12);
    
    const vendorUser = await prisma.user.upsert({
      where: { email: 'vendor@example.com' },
      update: {},
      create: {
        email: 'vendor@example.com',
        phone: '+1444555666',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: vendorPassword,
        role: UserRole.VENDOR,
        isEmailVerified: true,
        isPhoneVerified: true,
        lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    });

    console.log('✅ Vendor user created:', vendorUser.email);

    return {
      adminUser,
      customerUser,
      driverUser,
      vendorUser,
    };
  } catch (error) {
    console.error('❌ Error seeding user roles:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedUserRoles()
    .then(() => {
      console.log('🎉 User roles seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 User roles seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}