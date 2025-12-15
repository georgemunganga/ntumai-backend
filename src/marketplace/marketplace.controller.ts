import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../modules/auth/infrastructure/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/infrastructure/guards/roles.guard'; // Removed due to missing RolesGuard implementation
import { Roles } from '../shared/common/decorators/roles.decorator';
import { Public } from '../shared/common/decorators/public.decorator';
import { CatalogService } from './catalog/application/services/catalog.service';
import { CartService } from './cart/application/services/cart.service';
import { OrderService } from './orders/application/services/order.service';
import { VendorService } from './vendor/application/services/vendor.service';
import { PromotionService } from './promotions/application/services/promotion.service';
import { ReviewService } from './reviews/application/services/review.service';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly vendorService: VendorService,
    private readonly promotionService: PromotionService,
    private readonly reviewService: ReviewService,
  ) {}

  // ===== PUBLIC CATALOG ENDPOINTS =====

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    const categories = await this.catalogService.getCategories();
    return { success: true, data: { categories } };
  }

  @Public()
  @Get('categories/:categoryId/products')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async getCategoryProducts(
    @Param('categoryId') categoryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.catalogService.getCategoryProducts(
      categoryId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      sort || 'newest',
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('brands')
  @ApiOperation({ summary: 'Get all brands' })
  async getBrands() {
    const brands = await this.catalogService.getBrands();
    return { success: true, data: { brands } };
  }

  @Public()
  @Get('brands/:brandId/products')
  @ApiOperation({ summary: 'Get products by brand' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async getBrandProducts(
    @Param('brandId') brandId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.catalogService.getBrandProducts(
      brandId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      sort || 'newest',
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('products/search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async searchProducts(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.catalogService.searchProducts(
      query,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      sort || 'newest',
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('products/:productId')
  @ApiOperation({ summary: 'Get product details' })
  async getProduct(@Param('productId') productId: string, @Request() req) {
    const userId = req.user?.userId;
    const product = await this.catalogService.getProduct(productId, userId);
    return { success: true, data: { product } };
  }

  @Public()
  @Get('stores')
  @ApiOperation({ summary: 'Get all stores' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getStores(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.catalogService.getStores(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('stores/:storeId')
  @ApiOperation({ summary: 'Get store details' })
  async getStore(@Param('storeId') storeId: string) {
    const store = await this.catalogService.getStore(storeId);
    return { success: true, data: { store } };
  }

  @Public()
  @Get('stores/:storeId/products')
  @ApiOperation({ summary: 'Get store products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sort', required: false })
  async getStoreProducts(
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const result = await this.catalogService.getStoreProducts(
      storeId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      sort || 'newest',
    );
    return { success: true, data: result };
  }

  // ===== CUSTOMER CART ENDPOINTS =====

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/cart/add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBearerAuth()
  async addToCart(@Request() req, @Body() body: any) {
    const cart = await this.cartService.addToCart(
      req.user.userId,
      body.productId,
      body.quantity,
      body.variantOptions,
      body.note,
    );
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Put('customer/cart/items/:itemId')
  @ApiOperation({ summary: 'Update cart item' })
  @ApiBearerAuth()
  async updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const cart = await this.cartService.updateCartItem(
      req.user.userId,
      itemId,
      body.quantity,
      body.note,
    );
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Delete('customer/cart/items/:itemId')
  @ApiOperation({ summary: 'Remove cart item' })
  @ApiBearerAuth()
  async removeCartItem(@Request() req, @Param('itemId') itemId: string) {
    const cart = await this.cartService.removeCartItem(req.user.userId, itemId);
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Get('customer/cart')
  @ApiOperation({ summary: 'Get cart' })
  @ApiBearerAuth()
  async getCart(@Request() req) {
    const cart = await this.cartService.getCart(req.user.userId);
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/cart/apply-discount')
  @ApiOperation({ summary: 'Apply discount code' })
  @ApiBearerAuth()
  async applyDiscount(@Request() req, @Body() body: any) {
    const cart = await this.cartService.applyDiscount(
      req.user.userId,
      body.discountCode,
    );
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Delete('customer/cart/remove-discount')
  @ApiOperation({ summary: 'Remove discount' })
  @ApiBearerAuth()
  async removeDiscount(@Request() req) {
    const cart = await this.cartService.removeDiscount(req.user.userId);
    return { success: true, data: { cart } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/cart/clear')
  @ApiOperation({ summary: 'Clear cart' })
  @ApiBearerAuth()
  async clearCart(@Request() req) {
    const result = await this.cartService.clearCart(req.user.userId);
    return result;
  }

  // ===== CUSTOMER ORDER ENDPOINTS =====

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/checkout/calculate-delivery')
  @ApiOperation({ summary: 'Calculate delivery fee' })
  @ApiBearerAuth()
  async calculateDelivery(@Request() req, @Body() body: any) {
    const result = await this.orderService.calculateDelivery(
      req.user.userId,
      body.addressId,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/orders')
  @ApiOperation({ summary: 'Create order' })
  @ApiBearerAuth()
  async createOrder(@Request() req, @Body() body: any) {
    const order = await this.orderService.createOrder(
      req.user.userId,
      body.addressId,
      body.paymentMethod,
      body.notes,
      body.discountCode,
      body.scheduleAt,
    );
    return { success: true, data: { order } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/orders/:orderId/process-payment')
  @ApiOperation({ summary: 'Process payment' })
  @ApiBearerAuth()
  async processPayment(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() body: any,
  ) {
    const result = await this.orderService.processPayment(
      req.user.userId,
      orderId,
      body,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Get('customer/orders/:orderId')
  @ApiOperation({ summary: 'Get order details' })
  @ApiBearerAuth()
  async getOrder(@Request() req, @Param('orderId') orderId: string) {
    const order = await this.orderService.getOrder(req.user.userId, orderId);
    return { success: true, data: { order } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Get('customer/orders')
  @ApiOperation({ summary: 'Get order history' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.orderService.getOrders(
      req.user.userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/orders/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiBearerAuth()
  async cancelOrder(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() body: any,
  ) {
    const result = await this.orderService.cancelOrder(
      req.user.userId,
      orderId,
      body.reason,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/orders/:orderId/rate')
  @ApiOperation({ summary: 'Rate order' })
  @ApiBearerAuth()
  async rateOrder(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() body: any,
  ) {
    const result = await this.orderService.rateOrder(
      req.user.userId,
      orderId,
      body.rating,
      body.comment,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/orders/:orderId/reorder')
  @ApiOperation({ summary: 'Reorder' })
  @ApiBearerAuth()
  async reorder(@Request() req, @Param('orderId') orderId: string) {
    const result = await this.orderService.reorder(req.user.userId, orderId);
    return result;
  }

  // ===== VENDOR ENDPOINTS =====

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Post('vendor/stores')
  @ApiOperation({ summary: 'Create store' })
  @ApiBearerAuth()
  async createStore(@Request() req, @Body() body: any) {
    const store = await this.vendorService.createStore(req.user.userId, body);
    return { success: true, data: { store } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Patch('vendor/stores/:storeId')
  @ApiOperation({ summary: 'Update store' })
  @ApiBearerAuth()
  async updateStore(
    @Request() req,
    @Param('storeId') storeId: string,
    @Body() body: any,
  ) {
    const store = await this.vendorService.updateStore(
      req.user.userId,
      storeId,
      body,
    );
    return { success: true, data: { store } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Post('vendor/stores/:storeId/pause')
  @ApiOperation({ summary: 'Pause/unpause store' })
  @ApiBearerAuth()
  async pauseStore(
    @Request() req,
    @Param('storeId') storeId: string,
    @Body() body: any,
  ) {
    const result = await this.vendorService.pauseStore(
      req.user.userId,
      storeId,
      body.paused,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Get('vendor/stores/:storeId')
  @ApiOperation({ summary: 'Get store admin view' })
  @ApiBearerAuth()
  async getStoreAdmin(@Request() req, @Param('storeId') storeId: string) {
    const store = await this.vendorService.getStoreAdmin(
      req.user.userId,
      storeId,
    );
    return { success: true, data: { store } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Post('vendor/stores/:storeId/products')
  @ApiOperation({ summary: 'Create product' })
  @ApiBearerAuth()
  async createProduct(
    @Request() req,
    @Param('storeId') storeId: string,
    @Body() body: any,
  ) {
    const product = await this.vendorService.createProduct(
      req.user.userId,
      storeId,
      body,
    );
    return { success: true, data: { product } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Patch('vendor/stores/:storeId/products/:productId')
  @ApiOperation({ summary: 'Update product' })
  @ApiBearerAuth()
  async updateProduct(
    @Request() req,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    const product = await this.vendorService.updateProduct(
      req.user.userId,
      storeId,
      productId,
      body,
    );
    return { success: true, data: { product } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Patch('vendor/stores/:storeId/products/:productId/pricing')
  @ApiOperation({ summary: 'Update product pricing' })
  @ApiBearerAuth()
  async updateProductPricing(
    @Request() req,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    const result = await this.vendorService.updateProductPricing(
      req.user.userId,
      storeId,
      productId,
      body,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Patch('vendor/stores/:storeId/products/:productId/inventory')
  @ApiOperation({ summary: 'Update product inventory' })
  @ApiBearerAuth()
  async updateProductInventory(
    @Request() req,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    const result = await this.vendorService.updateProductInventory(
      req.user.userId,
      storeId,
      productId,
      body,
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Delete('vendor/stores/:storeId/products/:productId')
  @ApiOperation({ summary: 'Delete product' })
  @ApiBearerAuth()
  async deleteProduct(
    @Request() req,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
  ) {
    const result = await this.vendorService.deleteProduct(
      req.user.userId,
      storeId,
      productId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  @Get('vendor/stores/:storeId/orders')
  @ApiOperation({ summary: 'Get store orders' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getStoreOrders(
    @Request() req,
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.vendorService.getStoreOrders(
      req.user.userId,
      storeId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
    return { success: true, data: result };
  }

  // ===== PROMOTIONS & GIFT CARDS =====

  @UseGuards(JwtAuthGuard)
  @Get('customer/promotions')
  @ApiOperation({ summary: 'Get promotions' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'category', required: false })
  async getPromotions(@Query('category') category?: string) {
    const promotions = await this.promotionService.getPromotions(category);
    return { success: true, data: { promotions } };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/gifts')
  @ApiOperation({ summary: 'Create gift card' })
  @ApiBearerAuth()
  async createGiftCard(@Request() req, @Body() body: any) {
    const giftCard = await this.promotionService.createGiftCard(
      req.user.userId,
      body.amount,
      body.recipientEmail,
      body.recipientPhone,
      body.message,
      body.designId,
    );
    return { success: true, data: { giftCard } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/gifts/designs')
  @ApiOperation({ summary: 'Get gift card designs' })
  @ApiBearerAuth()
  async getGiftCardDesigns() {
    const designs = await this.promotionService.getGiftCardDesigns();
    return { success: true, data: { designs } };
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/gifts')
  @ApiOperation({ summary: 'Get gift card history' })
  @ApiBearerAuth()
  async getGiftCardHistory(@Request() req) {
    const history = await this.promotionService.getGiftCardHistory(
      req.user.userId,
    );
    return { success: true, data: history };
  }

  @UseGuards(JwtAuthGuard)
  @Post('customer/gifts/redeem')
  @ApiOperation({ summary: 'Redeem gift card' })
  @ApiBearerAuth()
  async redeemGiftCard(@Request() req, @Body() body: any) {
    const result = await this.promotionService.redeemGiftCard(
      req.user.userId,
      body.code,
    );
    return result;
  }

  // ===== REVIEWS & FAVORITES =====

  @Public()
  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewService.getProductReviews(
      productId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/reviews')
  @ApiOperation({ summary: 'Add product review' })
  @ApiBearerAuth()
  async addProductReview(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    const review = await this.reviewService.createProductReview(
      req.user.userId,
      productId,
      body.rating,
      body.comment,
      body.images,
    );
    return { success: true, data: { review } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/reviews/:reviewId/vote')
  @ApiOperation({ summary: 'Vote on review' })
  @ApiBearerAuth()
  async voteOnReview(
    @Request() req,
    @Param('reviewId') reviewId: string,
    @Body() body: any,
  ) {
    // Vote on review functionality not implemented yet
    return { success: true, message: 'Review vote recorded' };
  }

  @Public()
  @Get('stores/:storeId/reviews')
  @ApiOperation({ summary: 'Get store reviews' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getStoreReviews(
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewService.getStoreReviews(
      storeId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('stores/:storeId/reviews/summary')
  @ApiOperation({ summary: 'Get store review summary' })
  async getStoreReviewSummary(@Param('storeId') storeId: string) {
    const summary = await this.reviewService.getStoreReviews(storeId);
    return { success: true, data: summary };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/favorites/toggle')
  @ApiOperation({ summary: 'Toggle favorite' })
  @ApiBearerAuth()
  async toggleFavorite(@Request() req, @Body() body: any) {
    const result = await this.reviewService.toggleFavorite(
      req.user.userId,
      body.productId,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Get('customer/favorites')
  @ApiOperation({ summary: 'Get favorites' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFavorites(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewService.getFavorites(
      req.user.userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Post('customer/wishlist/toggle')
  @ApiOperation({ summary: 'Toggle wishlist' })
  @ApiBearerAuth()
  async toggleWishlist(@Request() req, @Body() body: any) {
    const result = await this.reviewService.addToWishlist(
      req.user.userId,
      body.productId,
      body.note,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER', 'VENDOR')
  @Get('customer/wishlist')
  @ApiOperation({ summary: 'Get wishlist' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getWishlist(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewService.getWishlist(
      req.user.userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, data: result };
  }
}
