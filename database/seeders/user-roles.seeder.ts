import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
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
        name: 'System Administrator', // Added required name field
        password: hashedPassword,
        currentRole: UserRole.ADMIN,
        // Removed availableRoles as it doesn't exist in the schema
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        // Removed emailVerifiedAt and phoneVerifiedAt as they don't exist in the schema
        // Removed profileCompletionPercentage as it doesn't exist in the schema
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
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
        name: 'John Doe', // Added required name field
        password: customerPassword,
        currentRole: UserRole.CUSTOMER,
        // Removed availableRoles as it doesn't exist in the schema
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        // Removed emailVerifiedAt and phoneVerifiedAt as they don't exist in the schema
        // Removed profileCompletionPercentage as it doesn't exist in the schema
        loyaltyTier: 'BRONZE',
        totalOrders: 5,
        totalSpent: 250.75,
        lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updatedAt: new Date(),
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
        name: 'Mike Wilson', // Added required name field
        password: driverPassword,
        currentRole: UserRole.DRIVER,
        // Removed availableRoles as it doesn't exist in the schema
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        // Removed emailVerifiedAt and phoneVerifiedAt as they don't exist in the schema
        // Removed profileCompletionPercentage as it doesn't exist in the schema
        lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updatedAt: new Date(),
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
        name: 'Sarah Johnson', // Added required name field
        password: vendorPassword,
        currentRole: UserRole.VENDOR,
        // Removed availableRoles as it doesn't exist in the schema
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
        // Removed emailVerifiedAt and phoneVerifiedAt as they don't exist in the schema
        // Removed profileCompletionPercentage as it doesn't exist in the schema
        lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        updatedAt: new Date(),
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