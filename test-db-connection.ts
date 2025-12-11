import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

async function testConnection() {
  console.log('Attempting to connect to the database via Prisma Accelerate...');
  const accelerateUrl = process.env.DATABASE_URL;

  if (!accelerateUrl) {
    throw new Error('DATABASE_URL is not defined in your environment.');
  }

  const prisma = new PrismaClient({
    accelerateUrl,
  });

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    const users = await prisma.user.findMany({ take: 1 });
    console.log(`Found ${users.length} user(s).`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
