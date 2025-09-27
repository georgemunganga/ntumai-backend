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
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.0060,
        landmark: 'Near Central Park',
        contactName: 'John Doe',
        contactPhone: '+1987654321',
        deliveryInstructions: 'Ring doorbell twice. Leave packages with doorman if not home.',
        accessCode: '1234',
        floorNumber: '4',
        isDefault: true,
        isActive: true,
        lastUsedAt: new Date(),
        usageCount: 15,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        updatedAt: new Date(),
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
        addressLine2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        country: 'United States',
        latitude: 40.7589,
        longitude: -73.9851,
        landmark: 'Next to Starbucks',
        contactName: 'John Doe',
        contactPhone: '+1987654321',
        deliveryInstructions: 'Deliver to reception desk during business hours (9 AM - 6 PM).',
        isDefault: false,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        usageCount: 8,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        updatedAt: new Date(),
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
        landmark: 'Near Brooklyn Bridge',
        contactName: 'Mike Wilson',
        contactPhone: '+1555666777',
        deliveryInstructions: 'Call upon arrival. Usually available after 6 PM.',
        isDefault: true,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        usageCount: 3,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(),
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
        addressLine2: 'Ground Floor',
        city: 'Manhattan',
        state: 'NY',
        postalCode: '10003',
        country: 'United States',
        latitude: 40.7282,
        longitude: -73.9942,
        landmark: 'Corner of Commerce and Main',
        contactName: 'Sarah Johnson',
        contactPhone: '+1444555666',
        deliveryInstructions: 'Business hours: 8 AM - 8 PM. Use rear entrance for deliveries.',
        accessCode: 'VENDOR2024',
        isDefault: true,
        isActive: true,
        lastUsedAt: new Date(),
        usageCount: 25,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        updatedAt: new Date(),
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
        addressLine2: 'Unit 12',
        city: 'Queens',
        state: 'NY',
        postalCode: '11101',
        country: 'United States',
        latitude: 40.7505,
        longitude: -73.9934,
        landmark: 'Industrial area near highway',
        contactName: 'Warehouse Manager',
        contactPhone: '+1444555667',
        deliveryInstructions: 'Loading dock access. Call 30 minutes before arrival.',
        accessCode: 'DOCK123',
        isDefault: false,
        isActive: true,
        lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        usageCount: 12,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        updatedAt: new Date(),
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