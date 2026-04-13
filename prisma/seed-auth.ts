import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log('Start seeding Auth module...');

  // --- Seed Users with different roles and statuses ---
  const password = await hash('password123', 10);
  const now = new Date();

  // 1. Active Customer
  await prisma.user.upsert({
    where: { id: 'user_admin' },
    update: {
      phone: '+10000000001',
      email: 'customer.active@example.com',
      firstName: 'Active',
      lastName: 'Customer',
      role: 'CUSTOMER',
      updatedAt: now,
    },
    create: {
      id: 'user_admin',
      phone: '+10000000001',
      email: 'customer.active@example.com',
      firstName: 'Active',
      lastName: 'Customer',
      password: password,
      role: 'CUSTOMER',
      isEmailVerified: true,
      isPhoneVerified: true,
      updatedAt: now,
      // isActive: true, // Removed due to new schema
      // status: UserStatus.ACTIVE, // Removed due to new schema
      // roles: {
      //   create: [{ roleType: RoleType.CUSTOMER, isActive: true }],
      // },
    },
  });

  // 2. Pending Verification User
  await prisma.user.upsert({
    where: { id: 'user_pending' },
    update: {
      phone: '+10000000002',
      email: 'user.pending@example.com',
      firstName: 'Pending',
      lastName: 'User',
      role: 'CUSTOMER',
      updatedAt: now,
    },
    create: {
      id: 'user_pending',
      phone: '+10000000002',
      email: 'user.pending@example.com',
      firstName: 'Pending',
      lastName: 'User',
      password: password,
      role: 'CUSTOMER',
      updatedAt: now,
      // isActive: false, // Removed due to new schema
      // status: UserStatus.PENDING_VERIFICATION, // Removed due to new schema
    },
  });

  // 3. Active Tasker
  await prisma.user.upsert({
    where: { id: 'user_tasker' },
    update: {
      phone: '+10000000003',
      email: 'tasker.active@example.com',
      firstName: 'Active',
      lastName: 'Tasker',
      role: 'DRIVER',
      updatedAt: now,
    },
    create: {
      id: 'user_tasker',
      phone: '+10000000003',
      email: 'tasker.active@example.com',
      firstName: 'Active',
      lastName: 'Tasker',
      password: password,
      role: 'DRIVER',
      isEmailVerified: true,
      isPhoneVerified: true,
      updatedAt: now,
      // isActive: true, // Removed due to new schema
      // status: UserStatus.ACTIVE, // Removed due to new schema
      // roles: {
      //   create: [{ roleType: RoleType.TASKER, isActive: true }],
      // },
    },
  });

  // 4. Suspended User
  await prisma.user.upsert({
    where: { id: 'user_suspended' },
    update: {
      phone: '+10000000004',
      email: 'user.suspended@example.com',
      firstName: 'Suspended',
      lastName: 'User',
      role: 'CUSTOMER',
      updatedAt: now,
    },
    create: {
      id: 'user_suspended',
      phone: '+10000000004',
      email: 'user.suspended@example.com',
      firstName: 'Suspended',
      lastName: 'User',
      password: password,
      role: 'CUSTOMER',
      updatedAt: now,
      // isActive: false, // Removed due to new schema
      // status: UserStatus.SUSPENDED, // Removed due to new schema
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
