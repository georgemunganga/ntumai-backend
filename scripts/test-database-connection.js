/**
 * Script to test database connectivity after standardization
 */
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Attempt to connect to the database
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // Try a simple query to verify functionality
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Successfully executed a test query:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    return false;
  } finally {
    // Always disconnect
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\nDatabase connection test completed successfully!');
      process.exit(0);
    } else {
      console.error('\nDatabase connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });