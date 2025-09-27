import { TestSetup } from '../setup/test-setup';
import { TestHelpers } from '../setup/test-helpers';
import { TestDatabaseSeeder } from '../setup/test-database-seeder';

describe('Marketplace Module (e2e)', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let seeder: TestDatabaseSeeder;
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    testSetup = await new TestSetup().initialize();
    helpers = new TestHelpers(testSetup);
    seeder = new TestDatabaseSeeder(testSetup.prismaService);
    await seeder.seedTestData();
    
    // Create test data for marketplace tests
    // We'll need to seed a category and product for testing
    const category = await testSetup.prismaService.category.create({
      data: {
        name: 'Test Category',
        description: 'Test category for e2e tests',
        slug: 'test-category',
        isActive: true
      }
    });
    categoryId = category.id;

    // Login as vendor to create products
    await testSetup.loginAsVendor();
  });

  afterAll(async () => {
    // Clean up test data
    await testSetup.prismaService.product.deleteMany({
      where: { name: { contains: 'Test Product' } }
    });
    await testSetup.prismaService.category.delete({
      where: { id: categoryId }
    }).catch(() => {});
    await testSetup.cleanup();
  });

  describe('Products API', () => {
    describe('POST /marketplace/products', () => {
      it('should create a new product as vendor', async () => {
        const productData = {
          name: 'Test Product',
          description: 'Test product description',
          price: 19.99,
          categoryId: categoryId,
          sku: 'TEST-SKU-001',
          quantity: 100,
          isActive: true,
          images: ['https://example.com/image.jpg']
        };

        const response = await helpers.authPost('/marketplace/products', productData);

        expect(response.status).toBe(201);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Test Product');
        
        // Save product ID for later tests
        productId = response.body.data.id;
      });

      it('should reject product creation for non-vendors', async () => {
        // Login as customer
        await testSetup.loginAsCustomer();

        const productData = {
          name: 'Customer Product',
          description: 'This should fail',
          price: 9.99,
          categoryId: categoryId,
          sku: 'FAIL-SKU-001',
          quantity: 10,
          isActive: true
        };

        const response = await helpers.authPost('/marketplace/products', productData);

        expect(response.status).toBe(403);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(false);
        
        // Switch back to vendor for remaining tests
        await testSetup.loginAsVendor();
      });
    });

    describe('GET /marketplace/products', () => {
      it('should return a list of products', async () => {
        const response = await helpers.publicGet('/marketplace/products');

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });

      it('should filter products by category', async () => {
        const response = await helpers.publicGet(`/marketplace/products?categoryId=${categoryId}`);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });
    });

    describe('GET /marketplace/products/:id', () => {
      it('should return a single product by ID', async () => {
        const response = await helpers.publicGet(`/marketplace/products/${productId}`);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', productId);
        expect(response.body.data).toHaveProperty('name', 'Test Product');
      });

      it('should return 404 for non-existent product', async () => {
        const response = await helpers.publicGet('/marketplace/products/non-existent-id');

        expect(response.status).toBe(404);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /marketplace/products/:id', () => {
      it('should update a product as vendor', async () => {
        const updateData = {
          name: 'Updated Test Product',
          description: 'Updated description',
          price: 24.99
        };

        const response = await helpers.authPut(`/marketplace/products/${productId}`, updateData);

        expect(response.status).toBe(200);
        helpers.expectStandardResponse(response);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Updated Test Product');
        expect(response.body.data).toHaveProperty('price', 24.99);
      });
    });
  });

  describe('Categories API', () => {
    it('should return a list of categories', async () => {
      const response = await helpers.publicGet('/marketplace/categories');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return a single category by ID', async () => {
      const response = await helpers.publicGet(`/marketplace/categories/${categoryId}`);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', categoryId);
      expect(response.body.data).toHaveProperty('name', 'Test Category');
    });
  });

  describe('Cart API', () => {
    it('should add a product to cart', async () => {
      // Login as customer
      await testSetup.loginAsCustomer();

      const cartItemData = {
        productId: productId,
        quantity: 2
      };

      const response = await helpers.authPost('/marketplace/cart', cartItemData);

      expect(response.status).toBe(201);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('should get cart contents', async () => {
      const response = await helpers.authGet('/marketplace/cart');

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should update cart item quantity', async () => {
      // First get the cart to find the cart item ID
      const cartResponse = await helpers.authGet('/marketplace/cart');
      const cartItemId = cartResponse.body.data.items[0].id;

      const updateData = {
        quantity: 3
      };

      const response = await helpers.authPut(`/marketplace/cart/${cartItemId}`, updateData);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.find(item => item.id === cartItemId).quantity).toBe(3);
    });

    it('should remove item from cart', async () => {
      // First get the cart to find the cart item ID
      const cartResponse = await helpers.authGet('/marketplace/cart');
      const cartItemId = cartResponse.body.data.items[0].id;

      const response = await helpers.authDelete(`/marketplace/cart/${cartItemId}`);

      expect(response.status).toBe(200);
      helpers.expectStandardResponse(response);
      expect(response.body.success).toBe(true);
      
      // Verify item was removed
      const updatedCartResponse = await helpers.authGet('/marketplace/cart');
      expect(updatedCartResponse.body.data.items.find(item => item.id === cartItemId)).toBeUndefined();
    });
  });
});