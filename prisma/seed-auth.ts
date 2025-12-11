import { PrismaClient, UserStatus, RoleType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Auth module...');

  // --- Clean up existing auth-related data ---
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Seed Users with different roles and statuses ---
  const password = await hash('password123', 10);

  // 1. Active Customer
  await prisma.user.create({
    data: {
      phoneNumber: '+10000000001',
      email: 'customer.active@example.com',
      firstName: 'Active',
      lastName: 'Customer',
      passwordHash: password,
      isActive: true,
      status: UserStatus.ACTIVE,
      roles: {
        create: [{ roleType: RoleType.CUSTOMER, isActive: true }],
      },
    },
  });

  // 2. Pending Verification User
  await prisma.user.create({
    data: {
      phoneNumber: '+10000000002',
      email: 'user.pending@example.com',
      firstName: 'Pending',
      lastName: 'User',
      passwordHash: password,
      isActive: false,
      status: UserStatus.PENDING_VERIFICATION,
    },
  });

  // 3. Active Tasker
  await prisma.user.create({
    data: {
      phoneNumber: '+10000000003',
      email: 'tasker.active@example.com',
      firstName: 'Active',
      lastName: 'Tasker',
      passwordHash: password,
      isActive: true,
      status: UserStatus.ACTIVE,
      roles: {
        create: [{ roleType: RoleType.TASKER, isActive: true }],
      },
    },
  });

  // 4. Suspended User
  await prisma.user.create({
    data: {
      phoneNumber: '+10000000004',
      email: 'user.suspended@example.com',
      firstName: 'Suspended',
      lastName: 'User',
      passwordHash: password,
      isActive: false,
      status: UserStatus.SUSPENDED,
    },
  });

  console.log('Auth module seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
