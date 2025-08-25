import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminEmail = 'admin@ntumai.com';
  const adminPhone = '1234567890';
  const adminCountryCode = '+1';
  const adminPassword = 'admin123';

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { phone: adminPhone, countryCode: adminCountryCode }
      ]
    }
  });

  if (!existingAdmin) {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        phone: adminPhone,
        countryCode: adminCountryCode,
        password: hashedPassword,
        name: 'System Administrator',
        currentRole: UserRole.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Grant admin role
    await prisma.userRole_Assignment.create({
      data: {
        userId: adminUser.id,
        role: UserRole.ADMIN,
      },
    });

    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.currentRole,
    });
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create sample customer user
  const customerEmail = 'customer@example.com';
  const customerPhone = '1234567891';
  const customerCountryCode = '+1';
  const customerPassword = 'customer123';

  const existingCustomer = await prisma.user.findFirst({
    where: {
      OR: [
        { email: customerEmail },
        { phone: customerPhone, countryCode: customerCountryCode }
      ]
    }
  });

  if (!existingCustomer) {
    const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);

    const customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        phone: customerPhone,
        countryCode: customerCountryCode,
        password: hashedCustomerPassword,
        name: 'John Doe',
        currentRole: UserRole.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Grant customer role
    await prisma.userRole_Assignment.create({
      data: {
        userId: customerUser.id,
        role: UserRole.CUSTOMER,
      },
    });

    console.log('✅ Customer user created:', {
      id: customerUser.id,
      email: customerUser.email,
      role: customerUser.currentRole,
    });
  } else {
    console.log('ℹ️  Customer user already exists');
  }

  // Create test user with example phone format
  const testEmail = 'test@example.com';
  const testPhone = '0972827372';
  const testCountryCode = '+26';
  const testPassword = 'test123';

  const existingTestUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: testEmail },
        { phone: testPhone, countryCode: testCountryCode }
      ]
    }
  });

  if (!existingTestUser) {
    const hashedTestPassword = await bcrypt.hash(testPassword, 12);

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        phone: testPhone,
        countryCode: testCountryCode,
        password: hashedTestPassword,
        name: 'Test User',
        currentRole: UserRole.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Grant customer role
    await prisma.userRole_Assignment.create({
      data: {
        userId: testUser.id,
        role: UserRole.CUSTOMER,
      },
    });

    console.log('✅ Test user created:', {
      id: testUser.id,
      email: testUser.email,
      phone: testUser.phone,
      countryCode: testUser.countryCode,
      role: testUser.currentRole,
    });
  } else {
    console.log('ℹ️  Test user already exists');
  }

  // Create sample driver user
  const driverEmail = 'driver@example.com';
  const driverPhone = '+1234567892';
  const driverPassword = 'Driver123!';

  const existingDriver = await prisma.user.findFirst({
    where: {
      OR: [
        { email: driverEmail },
        { phone: driverPhone }
      ]
    }
  });

  if (!existingDriver) {
    const hashedDriverPassword = await bcrypt.hash(driverPassword, 12);

    const driverUser = await prisma.user.create({
      data: {
        email: driverEmail,
        phone: driverPhone,
        password: hashedDriverPassword,
        name: 'Jane Smith',
        currentRole: UserRole.DRIVER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Grant driver role
    await prisma.userRole_Assignment.create({
      data: {
        userId: driverUser.id,
        role: UserRole.DRIVER,
      },
    });

    console.log('✅ Driver user created:', {
      id: driverUser.id,
      email: driverUser.email,
      role: driverUser.currentRole,
    });
  } else {
    console.log('ℹ️  Driver user already exists');
  }

  // Create sample vendor user
  const vendorEmail = 'vendor@example.com';
  const vendorPhone = '+1234567893';
  const vendorPassword = 'Vendor123!';

  const existingVendor = await prisma.user.findFirst({
    where: {
      OR: [
        { email: vendorEmail },
        { phone: vendorPhone }
      ]
    }
  });

  if (!existingVendor) {
    const hashedVendorPassword = await bcrypt.hash(vendorPassword, 12);

    const vendorUser = await prisma.user.create({
      data: {
        email: vendorEmail,
        phone: vendorPhone,
        password: hashedVendorPassword,
        name: 'Bob Johnson',
        currentRole: UserRole.VENDOR,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Grant vendor role
    await prisma.userRole_Assignment.create({
      data: {
        userId: vendorUser.id,
        role: UserRole.VENDOR,
      },
    });

    console.log('✅ Vendor user created:', {
      id: vendorUser.id,
      email: vendorUser.email,
      role: vendorUser.currentRole,
    });
  } else {
    console.log('ℹ️  Vendor user already exists');
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });