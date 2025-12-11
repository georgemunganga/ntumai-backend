import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

async function testConnection() {
  console.log('Attempting to connect to the database...');
  const prisma = new PrismaClient();
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

