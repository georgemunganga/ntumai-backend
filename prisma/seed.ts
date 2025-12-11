import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Clean up existing data ---
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tasker.deleteMany({});
  await prisma.task.deleteMany({});

  // --- Seed Users ---
  const password = await hash('password123', 10);
  const user1 = await prisma.user.create({
    data: {
      phoneNumber: '+10000000001',
      email: 'customer1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: password,
      isActive: true,
      roles: {
        create: [{ roleType: 'CUSTOMER', isActive: true }],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      phoneNumber: '+10000000002',
      email: 'tasker1@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      passwordHash: password,
      isActive: true,
      roles: {
        create: [{ roleType: 'TASKER', isActive: true }],
      },
    },
  });

  // --- Seed Taskers ---
  await prisma.tasker.create({
    data: {
      userId: user2.id,
      vehicleType: 'CAR',
      isOnline: true,
      rating: 4.8,
      completedTasks: 120,
      cancellationRate: 0.05,
      kycStatus: 'APPROVED',
      lastLocationLat: 34.0522, // Los Angeles
      lastLocationLng: -118.2437,
    },
  });

  // --- Seed Tasks ---
  await prisma.task.create({
    data: {
      customerId: user1.id,
      taskType: 'DELIVERY',
      status: 'CREATED',
      pickupAddress: { address: '123 Main St, Los Angeles, CA' },
      dropoffAddress: { address: '456 Oak Ave, Los Angeles, CA' },
      price: 25.50,
      paymentMethod: 'CARD',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
