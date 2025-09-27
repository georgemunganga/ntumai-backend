import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';

describe('Module Integration Tests (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;
  let userId: string;
  let productId: string;
  let orderId: string;
  let errandId: string;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
  });

  afterAll(async () => {
    await testSetup.cleanup();
  });

  describe('Auth -> Users Integration', () => {
    it('should register a new user and access user profile', async () => {
      // Register a new user through Auth module
      const registerData = {
        email: `integration-test-${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '+1234567890'
      };

      const registerResponse = await helpers.publicPost('/auth/register', registerData);
      expect(registerResponse.status).toBe(201);
      helpers.expectStandardResponse(registerResponse);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('accessToken');
      
      // Extract user ID and token
      const accessToken = registerResponse.body.data.accessToken;
      userId = registerResponse.body.data.user.id;
      
      // Access user profile with the token from Auth module
      const profileResponse = await helpers.authGet('/users/profile', accessToken);
      expect(profileResponse.status).toBe(200);
      helpers.expectStandardResponse(profileResponse);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data).toHaveProperty('id', userId);
      expect(profileResponse.body.data).toHaveProperty('email', registerData.email);
    });
  });

  describe('Marketplace -> Orders -> Drivers Integration', () => {
    it('should create a product, place an order, and assign a driver', async () => {
      // Login as vendor to create a product
      await testSetup.loginAsVendor();
      
      // Create a category for the product
      const category = await testSetup.prismaService.category.create({
        data: {
          name: 'Integration Test Category',
          description: 'Category for integration testing',
          slug: 'integration-test',
          isActive: true
        }
      });
      
      // Create a product in the Marketplace module
      const productData = {
        name: 'Integration Test Product',
        description: 'Product for integration testing',
        price: 29.99,
        categoryId: category.id,
        sku: 'INT-TEST-001',
        quantity: 50,
        isActive: true,
        images: ['https://example.com/test-image.jpg']
      };
      
      const productResponse = await helpers.authPost('/marketplace/products', productData);
      expect(productResponse.status).toBe(201);
      helpers.expectStandardResponse(productResponse);
      expect(productResponse.body.success).toBe(true);
      productId = productResponse.body.data.id;
      
      // Login as customer to place an order
      await testSetup.loginAsCustomer();
      
      // Add product to cart
      const cartItemData = {
        productId: productId,
        quantity: 1
      };
      
      const cartResponse = await helpers.authPost('/marketplace/cart', cartItemData);
      expect(cartResponse.status).toBe(201);
      helpers.expectStandardResponse(cartResponse);
      expect(cartResponse.body.success).toBe(true);
      
      // Create an address for the order
      const addressData = {
        label: 'Integration Test Address',
        street: '123 Integration St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Testland',
        isDefault: true
      };
      
      const addressResponse = await helpers.authPost('/users/addresses', addressData);
      expect(addressResponse.status).toBe(201);
      helpers.expectStandardResponse(addressResponse);
      const addressId = addressResponse.body.data.id;
      
      // Place the order
      const orderData = {
        addressId: addressId,
        paymentMethod: 'CARD',
        notes: 'Integration test order'
      };
      
      const orderResponse = await helpers.authPost('/marketplace/orders', orderData);
      expect(orderResponse.status).toBe(201);
      helpers.expectStandardResponse(orderResponse);
      expect(orderResponse.body.success).toBe(true);
      orderId = orderResponse.body.data.id;
      
      // Login as driver to accept the delivery
      await testSetup.loginAsDriver();
      
      // Accept the delivery (assuming there's an endpoint to accept deliveries)
      const acceptResponse = await helpers.authPost(`/delivery/orders/${orderId}/accept`, {});
      
      // This might be a 200 or 201 depending on implementation
      expect(acceptResponse.status).toBe(acceptResponse.status === 200 ? 200 : 201);
      helpers.expectStandardResponse(acceptResponse);
      expect(acceptResponse.body.success).toBe(true);
      
      // Verify the order status has changed to reflect driver assignment
      await testSetup.loginAsCustomer();
      const checkOrderResponse = await helpers.authGet(`/marketplace/orders/${orderId}`);
      expect(checkOrderResponse.status).toBe(200);
      helpers.expectStandardResponse(checkOrderResponse);
      expect(checkOrderResponse.body.data).toHaveProperty('status');
      // The status should no longer be 'PENDING' but something like 'ASSIGNED' or 'IN_PROGRESS'
      expect(checkOrderResponse.body.data.status).not.toBe('PENDING');
    });
  });

  describe('Errands -> Drivers -> Payments Integration', () => {
    it('should create an errand, assign a driver, and process payment', async () => {
      // Login as customer to create an errand
      await testSetup.loginAsCustomer();
      
      // Create an errand
      const errandData = {
        title: 'Integration Test Errand',
        description: 'Errand for integration testing',
        pickupLocation: {
          address: '123 Pickup St',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropoffLocation: {
          address: '456 Dropoff Ave',
          latitude: 40.7580,
          longitude: -73.9855
        },
        scheduledTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            notes: 'For integration testing'
          }
        ],
        estimatedValue: 15.00,
        paymentMethod: 'CARD'
      };
      
      const errandResponse = await helpers.authPost('/errands', errandData);
      expect(errandResponse.status).toBe(201);
      helpers.expectStandardResponse(errandResponse);
      expect(errandResponse.body.success).toBe(true);
      errandId = errandResponse.body.data.id;
      
      // Login as driver to accept the errand
      await testSetup.loginAsDriver();
      
      // Accept the errand
      const acceptResponse = await helpers.authPost(`/errands/${errandId}/accept`, {});
      expect(acceptResponse.status).toBe(acceptResponse.status === 200 ? 200 : 201);
      helpers.expectStandardResponse(acceptResponse);
      expect(acceptResponse.body.success).toBe(true);
      
      // Mark errand as picked up
      const pickupResponse = await helpers.authPost(`/errands/${errandId}/pickup`, {});
      expect(pickupResponse.status).toBe(200);
      helpers.expectStandardResponse(pickupResponse);
      expect(pickupResponse.body.success).toBe(true);
      
      // Mark errand as delivered
      const deliverResponse = await helpers.authPost(`/errands/${errandId}/deliver`, {});
      expect(deliverResponse.status).toBe(200);
      helpers.expectStandardResponse(deliverResponse);
      expect(deliverResponse.body.success).toBe(true);
      
      // Check if payment was processed
      const paymentResponse = await helpers.authGet(`/payments/transactions?referenceId=${errandId}`);
      expect(paymentResponse.status).toBe(200);
      helpers.expectStandardResponse(paymentResponse);
      expect(paymentResponse.body.success).toBe(true);
      
      // Verify the errand status
      const checkErrandResponse = await helpers.authGet(`/errands/${errandId}`);
      expect(checkErrandResponse.status).toBe(200);
      helpers.expectStandardResponse(checkErrandResponse);
      expect(checkErrandResponse.body.data).toHaveProperty('status', 'DELIVERED');
    });
  });

  describe('Users -> Notifications Integration', () => {
    it('should update user preferences and receive notifications', async () => {
      // Login as customer
      await testSetup.loginAsCustomer();
      
      // Update notification preferences
      const preferencesData = {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false
      };
      
      const preferencesResponse = await helpers.authPut('/users/notification-preferences', preferencesData);
      expect(preferencesResponse.status).toBe(200);
      helpers.expectStandardResponse(preferencesResponse);
      expect(preferencesResponse.body.success).toBe(true);
      
      // Check notifications (assuming there's an endpoint to get notifications)
      const notificationsResponse = await helpers.authGet('/notifications');
      expect(notificationsResponse.status).toBe(200);
      helpers.expectStandardResponse(notificationsResponse);
      expect(notificationsResponse.body.success).toBe(true);
      expect(Array.isArray(notificationsResponse.body.data.items)).toBe(true);
    });
  });
});