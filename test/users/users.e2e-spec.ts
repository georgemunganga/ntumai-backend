import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';

describe('Users Module (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
    await testSetup.loginAsCustomer();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('GET /users/profile', () => {
    it('should return the current user profile', async () => {
      const response = await helpers.authGet('/users/profile');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'customer@example.com');
      expect(response.body.data).toHaveProperty('firstName', 'Test');
      expect(response.body.data).toHaveProperty('lastName', 'Customer');
    });
  });

  describe('PUT /users/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Customer',
        phone: '+1234567890',
      };

      const response = await helpers.authPut('/users/profile', updateData);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('firstName', 'Updated');
      expect(response.body.data).toHaveProperty('lastName', 'Customer');
    });

    it('should reject invalid profile data', async () => {
      const invalidData = {
        firstName: '', // Empty name should be rejected
        lastName: 'Customer',
        phone: 'invalid-phone', // Invalid phone format
      };

      const response = await helpers.authPut('/users/profile', invalidData);

      expect(response.status).toBe(400);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /users/change-password', () => {
    it('should change user password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      const response = await helpers.authPost('/users/change-password', passwordData);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);

      // Verify we can login with the new password
      const loginResponse = await helpers.publicPost('/auth/login', {
        email: 'customer@example.com',
        password: 'NewPassword123!',
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      };

      const response = await helpers.authPost('/users/change-password', passwordData);

      expect(response.status).toBe(401);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /users/addresses', () => {
    it('should add a new address', async () => {
      const addressData = {
        label: 'Home',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        isDefault: true,
      };

      const response = await helpers.authPost('/users/addresses', addressData);

      expect(response.status).toBe(201);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('label', 'Home');
      expect(response.body.data).toHaveProperty('street', '123 Main St');
    });
  });

  describe('GET /users/addresses', () => {
    it('should return user addresses', async () => {
      const response = await helpers.authGet('/users/addresses');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /users/switch-role', () => {
    it('should switch user role if they have multiple roles', async () => {
      // This test assumes the user has multiple roles
      // We'll need to login as admin who might have multiple roles
      await testSetup.loginAsAdmin();

      const switchRoleData = {
        role: 'ADMIN',
      };

      const response = await helpers.authPost('/users/switch-role', switchRoleData, testSetup.adminAuthToken);

      // The response might vary depending on implementation
      // If the user has the role, it should succeed
      if (response.status === 200) {
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
      } else {
        // If the user doesn't have the role, it should fail with 403
        expect(response.status).toBe(403);
      }
    });
  });
});