import { PrismaClient } from '@prisma/client';
import { Priority } from '../../domain/value-objects/priority';

const prisma = new PrismaClient();

export async function seedErrandTemplates() {
  console.log('Seeding errand templates...');

  const templates = [
    {
      name: 'Grocery Shopping',
      description: 'Pick up groceries from the store',
      category: 'Shopping',
      tags: ['groceries', 'shopping', 'food'],
      requirements: ['Valid ID', 'Shopping list'],
      defaultPickupLocation: {
        address: 'Local Grocery Store',
        latitude: 0,
        longitude: 0,
        instructions: 'Meet at customer service desk',
      },
      defaultDropoffLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Ring doorbell and wait',
      },
      defaultPrice: 15.00,
      defaultPriority: Priority.MEDIUM.value,
      estimatedDuration: 60, // 1 hour
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Document Delivery',
      description: 'Deliver important documents between offices',
      category: 'Delivery',
      tags: ['documents', 'delivery', 'business'],
      requirements: ['Valid ID', 'Signature confirmation'],
      defaultPickupLocation: {
        address: 'Office Building A',
        latitude: 0,
        longitude: 0,
        instructions: 'Reception desk, ask for document pickup',
      },
      defaultDropoffLocation: {
        address: 'Office Building B',
        latitude: 0,
        longitude: 0,
        instructions: 'Deliver to reception, get signature',
      },
      defaultPrice: 25.00,
      defaultPriority: Priority.HIGH.value,
      estimatedDuration: 45, // 45 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Pharmacy Pickup',
      description: 'Pick up prescription medications',
      category: 'Healthcare',
      tags: ['pharmacy', 'medication', 'healthcare'],
      requirements: ['Valid ID', 'Prescription number', 'Insurance card'],
      defaultPickupLocation: {
        address: 'Local Pharmacy',
        latitude: 0,
        longitude: 0,
        instructions: 'Pharmacy counter, provide prescription details',
      },
      defaultDropoffLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Hand deliver to customer personally',
      },
      defaultPrice: 12.00,
      defaultPriority: Priority.HIGH.value,
      estimatedDuration: 30, // 30 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Food Delivery',
      description: 'Pick up and deliver food from restaurants',
      category: 'Food',
      tags: ['food', 'restaurant', 'delivery'],
      requirements: ['Insulated bag', 'Valid ID'],
      defaultPickupLocation: {
        address: 'Restaurant Location',
        latitude: 0,
        longitude: 0,
        instructions: 'Check in with host, mention pickup order',
      },
      defaultDropoffLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Ring doorbell, ensure food is still warm',
      },
      defaultPrice: 8.00,
      defaultPriority: Priority.MEDIUM.value,
      estimatedDuration: 40, // 40 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Package Return',
      description: 'Return packages to shipping centers',
      category: 'Shipping',
      tags: ['package', 'return', 'shipping'],
      requirements: ['Return label', 'Valid ID'],
      defaultPickupLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Collect package with return label attached',
      },
      defaultDropoffLocation: {
        address: 'Shipping Center',
        latitude: 0,
        longitude: 0,
        instructions: 'Drop off at returns counter, get receipt',
      },
      defaultPrice: 10.00,
      defaultPriority: Priority.LOW.value,
      estimatedDuration: 35, // 35 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Pet Supply Run',
      description: 'Pick up pet food and supplies',
      category: 'Pet Care',
      tags: ['pets', 'supplies', 'shopping'],
      requirements: ['Shopping list', 'Valid ID'],
      defaultPickupLocation: {
        address: 'Pet Store',
        latitude: 0,
        longitude: 0,
        instructions: 'Ask staff for assistance finding items',
      },
      defaultDropoffLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Leave at front door if no answer',
      },
      defaultPrice: 18.00,
      defaultPriority: Priority.MEDIUM.value,
      estimatedDuration: 50, // 50 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Dry Cleaning Pickup',
      description: 'Pick up and deliver dry cleaning',
      category: 'Personal Care',
      tags: ['dry cleaning', 'laundry', 'clothing'],
      requirements: ['Pickup ticket', 'Valid ID'],
      defaultPickupLocation: {
        address: 'Dry Cleaner',
        latitude: 0,
        longitude: 0,
        instructions: 'Present ticket at counter',
      },
      defaultDropoffLocation: {
        address: 'Customer Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Hang clothes carefully, ring doorbell',
      },
      defaultPrice: 14.00,
      defaultPriority: Priority.LOW.value,
      estimatedDuration: 25, // 25 minutes
      isPublic: true,
      isActive: true,
    },
    {
      name: 'Office Supply Run',
      description: 'Pick up office supplies and equipment',
      category: 'Business',
      tags: ['office', 'supplies', 'business'],
      requirements: ['Purchase order', 'Valid ID', 'Company card'],
      defaultPickupLocation: {
        address: 'Office Supply Store',
        latitude: 0,
        longitude: 0,
        instructions: 'Business customer service desk',
      },
      defaultDropoffLocation: {
        address: 'Office Address',
        latitude: 0,
        longitude: 0,
        instructions: 'Deliver to reception or specified department',
      },
      defaultPrice: 22.00,
      defaultPriority: Priority.MEDIUM.value,
      estimatedDuration: 55, // 55 minutes
      isPublic: true,
      isActive: true,
    },
  ];

  // Find or create an admin user for the templates
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    // Create a default admin user if none exists
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@ntumai.com',
        password: 'hashed_password', // This should be properly hashed
        firstName: 'System',
        lastName: 'Admin',
        phone: '+1234567890',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
      },
    });
  }

  for (const template of templates) {
    const existingTemplate = await prisma.errandTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existingTemplate) {
      await prisma.errandTemplate.create({
        data: {
          ...template,
          createdBy: adminUser.id,
          usageCount: 0,
        },
      });
      console.log(`Created template: ${template.name}`);
    } else {
      console.log(`Template already exists: ${template.name}`);
    }
  }

  console.log('Errand templates seeding completed!');
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedErrandTemplates()
    .catch((e) => {
      console.error('Error seeding errand templates:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}