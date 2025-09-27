import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';

describe('Drivers Module (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;
  let driverProfileId: string;
  let vehicleId: string;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
    
    // Login as driver for most tests
    await testSetup.loginAsDriver();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('Rider Profile API', () => {
    describe('GET /drivers/profile', () => {
      it('should return the driver profile', async () => {
        const response = await helpers.authGet('/drivers/profile');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('userId');
        
        // Save profile ID for later tests
        driverProfileId = response.body.data.id;
      });

      it('should reject access for non-drivers', async () => {
        // Login as customer
        await testSetup.loginAsCustomer();

        const response = await helpers.authGet('/drivers/profile');

        expect(response.status).toBe(403);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(false);
        
        // Switch back to driver for remaining tests
        await testSetup.loginAsDriver();
      });
    });

    describe('PUT /drivers/profile', () => {
      it('should update driver profile', async () => {
        const updateData = {
          bio: 'Experienced driver with 5+ years',
          preferredZones: ['Downtown', 'Midtown'],
          availability: 'FULL_TIME',
          maxDistance: 25
        };

        const response = await helpers.authPut('/drivers/profile', updateData);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('bio', 'Experienced driver with 5+ years');
        expect(response.body.data).toHaveProperty('availability', 'FULL_TIME');
      });
    });
  });

  describe('Vehicle API', () => {
    describe('POST /drivers/vehicles', () => {
      it('should add a new vehicle', async () => {
        const vehicleData = {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          color: 'Silver',
          licensePlate: 'ABC123',
          registrationNumber: 'REG12345',
          insuranceNumber: 'INS12345',
          isActive: true
        };

        const response = await helpers.authPost('/drivers/vehicles', vehicleData);

        expect(response.status).toBe(201);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('make', 'Toyota');
        expect(response.body.data).toHaveProperty('model', 'Camry');
        
        // Save vehicle ID for later tests
        vehicleId = response.body.data.id;
      });
    });

    describe('GET /drivers/vehicles', () => {
      it('should return driver vehicles', async () => {
        const response = await helpers.authGet('/drivers/vehicles');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /drivers/vehicles/:id', () => {
      it('should update vehicle information', async () => {
        const updateData = {
          color: 'Black',
          insuranceNumber: 'INS98765'
        };

        const response = await helpers.authPut(`/drivers/vehicles/${vehicleId}`, updateData);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('color', 'Black');
        expect(response.body.data).toHaveProperty('insuranceNumber', 'INS98765');
      });
    });
  });

  describe('Earnings API', () => {
    describe('GET /drivers/earnings', () => {
      it('should return driver earnings summary', async () => {
        const response = await helpers.authGet('/drivers/earnings');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('period');
      });

      it('should filter earnings by date range', async () => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        const startDate = lastMonth.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const response = await helpers.authGet(`/drivers/earnings?startDate=${startDate}&endDate=${endDate}`);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Shift API', () => {
    it('should start a driver shift', async () => {
      const shiftData = {
        vehicleId: vehicleId,
        startLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const response = await helpers.authPost('/drivers/shifts/start', shiftData);

      expect(response.status).toBe(201);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('startTime');
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should end a driver shift', async () => {
      const endData = {
        endLocation: {
          latitude: 40.7300,
          longitude: -73.9950
        }
      };

      const response = await helpers.authPost('/drivers/shifts/end', endData);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('endTime');
      expect(response.body.data).toHaveProperty('status', 'COMPLETED');
    });
  });

  describe('Rating API', () => {
    it('should get driver ratings', async () => {
      const response = await helpers.authGet('/drivers/ratings');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('averageRating');
      expect(response.body.data).toHaveProperty('totalRatings');
    });
  });
});