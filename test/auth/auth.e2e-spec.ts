import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';
import * as request from 'supertest';

describe('Auth Module (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await helpers.publicPost('/auth/register', {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        phone: '+1987654321',
      });

      expect(response.status).toBe(201);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', 'newuser@example.com');
    });

    it('should reject registration with invalid data', async () => {
      const response = await helpers.publicPost('/auth/register', {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      });

      expect(response.status).toBe(400);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await helpers.publicPost('/auth/login', {
        email: 'customer@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await helpers.publicPost('/auth/login', {
        email: 'customer@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await helpers.publicPost('/auth/login', {
        email: 'customer@example.com',
        password: 'password123',
      });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await helpers.publicPost('/auth/refresh', {
        refreshToken,
      });

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject with invalid refresh token', async () => {
      const response = await helpers.publicPost('/auth/refresh', {
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      await testSetup.loginAsCustomer();

      const response = await helpers.authGet('/auth/profile');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', 'customer@example.com');
    });

    it('should reject with invalid token', async () => {
      const response = await request(testSetup.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should process forgot password request', async () => {
      const response = await helpers.publicPost('/auth/forgot-password', {
        email: 'customer@example.com',
      });

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      await testSetup.loginAsCustomer();

      const response = await helpers.authPost('/auth/logout', {});

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
    });
  });
});