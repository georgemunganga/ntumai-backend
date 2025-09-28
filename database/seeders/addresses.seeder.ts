import { PrismaClient, AddressType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAddresses() {
  console.log('🌱 Seeding sample addresses...');

  try {
    // Get existing users
    const customerUser = await prisma.user.findUnique({
      where: { email: 'customer@example.com' },
    });

    const driverUser = await prisma.user.findUnique({
      where: { email: 'driver@example.com' },
    });

    const vendorUser = await prisma.user.findUnique({
      where: { email: 'vendor@example.com' },
    });

    if (!customerUser || !driverUser || !vendorUser) {
      throw new Error('Required users not found. Please run user-roles seeder first.');
    }

    // Customer addresses
    const customerHomeAddress = await prisma.address.upsert({
      where: {
        id: `${customerUser.id}-HOME`,
      },
      update: {},
      create: {
        userId: customerUser.id,
        type: AddressType.HOME,
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.0060,
        isDefault: true,
      },
    });

    const customerWorkAddress = await prisma.address.upsert({
      where: {
        id: `${customerUser.id}-WORK`,
      },
      update: {},
      create: {
        userId: customerUser.id,
        type: AddressType.WORK,
        address: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        country: 'United States',
        latitude: 40.7589,
        longitude: -73.9851,
        isDefault: false,
      },
    });

    console.log('✅ Customer addresses created');

    // Driver address
    const driverAddress = await prisma.address.upsert({
      where: {
        id: `${driverUser.id}-HOME`,
      },

      update: {},
      create: {
        userId: driverUser.id,
        type: AddressType.HOME,
        address: '789 Driver Lane',
        city: 'Brooklyn',
        state: 'NY',
        postalCode: '11201',
        country: 'United States',
        latitude: 40.6892,
        longitude: -73.9442,
        isDefault: true,
      },
    });

    console.log('✅ Driver address created');

    // Vendor addresses
    const vendorBusinessAddress = await prisma.address.upsert({
      where: {
        id: `${vendorUser.id}-BUSINESS`,
      },
      update: {},
      create: {
        userId: vendorUser.id,
        type: AddressType.OTHER, // Changed from BUSINESS to OTHER since BUSINESS doesn't exist in schema
        address: '321 Commerce Street',
        city: 'Manhattan',
        state: 'NY',
        postalCode: '10003',
        country: 'United States',
        latitude: 40.7282,
        longitude: -73.9942,
        isDefault: true,
      },
    });

    const vendorWarehouseAddress = await prisma.address.upsert({
      where: {
        id: `${vendorUser.id}-WAREHOUSE`,
      },
      update: {},
      create: {
        userId: vendorUser.id,
        type: AddressType.OTHER,
        address: '555 Warehouse District',
        city: 'Queens',
        state: 'NY',
        postalCode: '11101',
        country: 'United States',
        latitude: 40.7505,
        longitude: -73.9934,
        isDefault: false,
      },
    });

    console.log('✅ Vendor addresses created');

    return {
      customerAddresses: [customerHomeAddress, customerWorkAddress],
      driverAddress,
      vendorAddresses: [vendorBusinessAddress, vendorWarehouseAddress],
    };
  } catch (error) {
    console.error('❌ Error seeding addresses:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAddresses()
    .then(() => {
      console.log('🎉 Addresses seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Addresses seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}