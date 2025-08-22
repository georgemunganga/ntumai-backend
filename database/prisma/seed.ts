import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminEmail = 'admin@ntumai.com';
  const adminPhone = '+1234567890';
  const adminPassword = 'Admin123!';

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { phone: adminPhone }
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
        password: hashedPassword,
        name: 'System Administrator',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create sample customer user
  const customerEmail = 'customer@example.com';
  const customerPhone = '+1234567891';
  const customerPassword = 'Customer123!';

  const existingCustomer = await prisma.user.findFirst({
    where: {
      OR: [
        { email: customerEmail },
        { phone: customerPhone }
      ]
    }
  });

  if (!existingCustomer) {
    const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);

    const customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        phone: customerPhone,
        password: hashedCustomerPassword,
        name: 'John Doe',
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Customer user created:', {
      id: customerUser.id,
      email: customerUser.email,
      role: customerUser.role,
    });
  } else {
    console.log('ℹ️  Customer user already exists');
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
        role: UserRole.DRIVER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Driver user created:', {
      id: driverUser.id,
      email: driverUser.email,
      role: driverUser.role,
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
        role: UserRole.VENDOR,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log('✅ Vendor user created:', {
      id: vendorUser.id,
      email: vendorUser.email,
      role: vendorUser.role,
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