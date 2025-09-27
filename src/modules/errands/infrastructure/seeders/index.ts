import { seedErrandTemplates } from './errand-templates.seeder';

export async function seedErrandsModule() {
  console.log('Starting errands module seeding...');
  
  try {
    await seedErrandTemplates();
    console.log('Errands module seeding completed successfully!');
  } catch (error) {
    console.error('Error during errands module seeding:', error);
    throw error;
  }
}

// Export individual seeders
export { seedErrandTemplates };

// Run all seeders if this file is executed directly
if (require.main === module) {
  seedErrandsModule()
    .catch((e) => {
      console.error('Seeding failed:', e);
      process.exit(1);
    });
}