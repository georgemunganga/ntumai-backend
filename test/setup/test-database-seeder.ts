import { PrismaService } from '@common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export class TestDatabaseSeeder {
  constructor(private readonly prisma: PrismaService) {}

  async seedTestData() {
    await this.cleanDatabase();
    await this.seedRoles();
    await this.seedUsers();
  }

  async cleanDatabase() {
    // Clean up tables in reverse order of dependencies
    const tables = [
      'user_roles',
      'user_addresses',
      'users',
      'roles'
    ];

    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
  }

  async seedRoles() {
    await this.prisma.role.createMany({
      data: [
        { name: 'CUSTOMER' },
        { name: 'DRIVER' },
        { name: 'VENDOR' },
        { name: 'ADMIN' },
      ],
      skipDuplicates: true,
    });
  }

  async seedUsers() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('adminpassword123', 10);
    const driverPassword = await bcrypt.hash('driverpassword123', 10);
    const vendorPassword = await bcrypt.hash('vendorpassword123', 10);

    // Get role IDs
    const customerRole = await this.prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const driverRole = await this.prisma.role.findUnique({ where: { name: 'DRIVER' } });
    const vendorRole = await this.prisma.role.findUnique({ where: { name: 'VENDOR' } });

    if (!customerRole || !adminRole || !driverRole || !vendorRole) {
      throw new Error('Required roles not found');
    }

    // Create test users
    const customer = await this.prisma.user.create({
      data: {
        email: 'customer@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+1234567890',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1987654321',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    const driver = await this.prisma.user.create({
      data: {
        email: 'driver@example.com',
        password: driverPassword,
        firstName: 'Test',
        lastName: 'Driver',
        phone: '+1122334455',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    const vendor = await this.prisma.user.create({
      data: {
        email: 'vendor@example.com',
        password: vendorPassword,
        firstName: 'Test',
        lastName: 'Vendor',
        phone: '+1555666777',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    // Assign roles
    await this.prisma.userRole.create({
      data: {
        userId: customer.id,
        roleId: customerRole.id,
      },
    });

    await this.prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });

    await this.prisma.userRole.create({
      data: {
        userId: driver.id,
        roleId: driverRole.id,
      },
    });

    await this.prisma.userRole.create({
      data: {
        userId: vendor.id,
        roleId: vendorRole.id,
      },
    });

    return { customer, admin, driver, vendor };
  }
}