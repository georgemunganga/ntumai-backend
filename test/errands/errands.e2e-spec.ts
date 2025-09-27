import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';

describe('Errands Module (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;
  let errandId: string;
  let templateId: string;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
    
    // Login as customer for creating errands
    await testSetup.loginAsCustomer();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('Errands API', () => {
    describe('POST /errands', () => {
      it('should create a new errand as customer', async () => {
        const errandData = {
          title: 'Grocery Shopping',
          description: 'Pick up groceries from the store',
          pickupLocation: {
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          },
          dropoffLocation: {
            address: '456 Park Ave',
            latitude: 40.7580,
            longitude: -73.9855
          },
          scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          items: [
            {
              name: 'Milk',
              quantity: 2,
              notes: 'Whole milk preferred'
            },
            {
              name: 'Bread',
              quantity: 1,
              notes: 'Whole wheat'
            }
          ],
          estimatedValue: 25.50,
          paymentMethod: 'CARD'
        };

        const response = await helpers.authPost('/errands', errandData);

        expect(response.status).toBe(201);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('status', 'PENDING');
        
        // Save errand ID for later tests
        errandId = response.body.data.id;
      });
    });

    describe('GET /errands', () => {
      it('should return customer errands', async () => {
        const response = await helpers.authGet('/errands');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.length).toBeGreaterThan(0);
      });

      it('should filter errands by status', async () => {
        const response = await helpers.authGet('/errands?status=PENDING');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.every(item => item.status === 'PENDING')).toBe(true);
      });
    });

    describe('GET /errands/:id', () => {
      it('should return a single errand by ID', async () => {
        const response = await helpers.authGet(`/errands/${errandId}`);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', errandId);
        expect(response.body.data).toHaveProperty('title', 'Grocery Shopping');
      });

      it('should return 404 for non-existent errand', async () => {
        const response = await helpers.authGet('/errands/00000000-0000-0000-0000-000000000000');

        expect(response.status).toBe(404);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /errands/:id', () => {
      it('should update an errand as customer', async () => {
        const updateData = {
          title: 'Updated Grocery Shopping',
          description: 'Updated description for grocery shopping',
          estimatedValue: 30.00
        };

        const response = await helpers.authPut(`/errands/${errandId}`, updateData);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('title', 'Updated Grocery Shopping');
        expect(response.body.data).toHaveProperty('estimatedValue', 30.00);
      });

      it('should reject updates after errand is assigned', async () => {
        // First, login as driver to accept the errand
        await testSetup.loginAsDriver();
        
        // Accept the errand
        const acceptResponse = await helpers.authPost(`/errands/${errandId}/accept`, {});
        
        // If acceptance is successful, try to update as customer
        if (acceptResponse.status === 200) {
          // Login back as customer
          await testSetup.loginAsCustomer();
          
          const updateData = {
            title: 'Should Not Update',
            description: 'This update should be rejected'
          };

          const response = await helpers.authPut(`/errands/${errandId}`, updateData);

          expect(response.status).toBe(400);
          helpers.expectStandardResponse(response);
          expect(response.body.success).toBe(false);
        }
        
        // Login back as customer for remaining tests
        await testSetup.loginAsCustomer();
      });
    });

    describe('DELETE /errands/:id', () => {
      it('should cancel an errand', async () => {
        // Create a new errand to cancel
        const errandData = {
          title: 'Errand to Cancel',
          description: 'This errand will be cancelled',
          pickupLocation: {
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          },
          dropoffLocation: {
            address: '456 Park Ave',
            latitude: 40.7580,
            longitude: -73.9855
          },
          scheduledTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          estimatedValue: 15.00,
          paymentMethod: 'CASH'
        };

        const createResponse = await helpers.authPost('/errands', errandData);
        const errandToCancel = createResponse.body.data.id;

        const response = await helpers.authDelete(`/errands/${errandToCancel}`);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        
        // Verify errand is cancelled
        const checkResponse = await helpers.authGet(`/errands/${errandToCancel}`);
        expect(checkResponse.body.data).toHaveProperty('status', 'CANCELLED');
      });
    });
  });

  describe('Errand Templates API', () => {
    describe('POST /errands/templates', () => {
      it('should create a new errand template', async () => {
        const templateData = {
          name: 'Weekly Grocery Run',
          description: 'Template for weekly grocery shopping',
          pickupLocation: {
            address: '123 Main St',
            latitude: 40.7128,
            longitude: -74.0060
          },
          dropoffLocation: {
            address: '456 Park Ave',
            latitude: 40.7580,
            longitude: -73.9855
          },
          items: [
            {
              name: 'Milk',
              quantity: 2,
              notes: 'Whole milk preferred'
            },
            {
              name: 'Eggs',
              quantity: 1,
              notes: 'Dozen, large'
            }
          ],
          estimatedValue: 20.00
        };

        const response = await helpers.authPost('/errands/templates', templateData);

        expect(response.status).toBe(201);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Weekly Grocery Run');
        
        // Save template ID for later tests
        templateId = response.body.data.id;
      });
    });

    describe('GET /errands/templates', () => {
      it('should return user templates', async () => {
        const response = await helpers.authGet('/errands/templates');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('POST /errands/from-template/:templateId', () => {
      it('should create an errand from template', async () => {
        const errandData = {
          scheduledTime: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
          paymentMethod: 'CARD'
        };

        const response = await helpers.authPost(`/errands/from-template/${templateId}`, errandData);

        expect(response.status).toBe(201);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('status', 'PENDING');
      });
    });
  });
});