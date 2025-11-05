"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/infrastructure/guards/roles.guard");
const roles_decorator_1 = require("../shared/common/decorators/roles.decorator");
const public_decorator_1 = require("../shared/common/decorators/public.decorator");
const catalog_service_1 = require("./catalog/application/services/catalog.service");
const cart_service_1 = require("./cart/application/services/cart.service");
const order_service_1 = require("./orders/application/services/order.service");
const vendor_service_1 = require("./vendor/application/services/vendor.service");
const promotion_service_1 = require("./promotions/application/services/promotion.service");
const review_service_1 = require("./reviews/application/services/review.service");
let MarketplaceController = class MarketplaceController {
    catalogService;
    cartService;
    orderService;
    vendorService;
    promotionService;
    reviewService;
    constructor(catalogService, cartService, orderService, vendorService, promotionService, reviewService) {
        this.catalogService = catalogService;
        this.cartService = cartService;
        this.orderService = orderService;
        this.vendorService = vendorService;
        this.promotionService = promotionService;
        this.reviewService = reviewService;
    }
    async getCategories() {
        const categories = await this.catalogService.getCategories();
        return { success: true, data: { categories } };
    }
    async getCategoryProducts(categoryId, page, limit, sort) {
        const result = await this.catalogService.getCategoryProducts(categoryId, parseInt(page || '1'), parseInt(limit || '20'), sort || 'newest');
        return { success: true, data: result };
    }
    async getBrands() {
        const brands = await this.catalogService.getBrands();
        return { success: true, data: { brands } };
    }
    async getBrandProducts(brandId, page, limit, sort) {
        const result = await this.catalogService.getBrandProducts(brandId, parseInt(page || '1'), parseInt(limit || '20'), sort || 'newest');
        return { success: true, data: result };
    }
    async searchProducts(query, page, limit, sort) {
        const result = await this.catalogService.searchProducts(query, parseInt(page || '1'), parseInt(limit || '20'), sort || 'newest');
        return { success: true, data: result };
    }
    async getProduct(productId, req) {
        const userId = req.user?.userId;
        const product = await this.catalogService.getProduct(productId, userId);
        return { success: true, data: { product } };
    }
    async getStores(page, limit) {
        const result = await this.catalogService.getStores(parseInt(page || '1'), parseInt(limit || '20'));
        return { success: true, data: result };
    }
    async getStore(storeId) {
        const store = await this.catalogService.getStore(storeId);
        return { success: true, data: { store } };
    }
    async getStoreProducts(storeId, page, limit, sort) {
        const result = await this.catalogService.getStoreProducts(storeId, parseInt(page || '1'), parseInt(limit || '20'), sort || 'newest');
        return { success: true, data: result };
    }
    async addToCart(req, body) {
        const cart = await this.cartService.addToCart(req.user.userId, body.productId, body.quantity, body.variantOptions, body.note);
        return { success: true, data: { cart } };
    }
    async updateCartItem(req, itemId, body) {
        const cart = await this.cartService.updateCartItem(req.user.userId, itemId, body.quantity, body.note);
        return { success: true, data: { cart } };
    }
    async removeCartItem(req, itemId) {
        const cart = await this.cartService.removeCartItem(req.user.userId, itemId);
        return { success: true, data: { cart } };
    }
    async getCart(req) {
        const cart = await this.cartService.getCart(req.user.userId);
        return { success: true, data: { cart } };
    }
    async applyDiscount(req, body) {
        const cart = await this.cartService.applyDiscount(req.user.userId, body.discountCode);
        return { success: true, data: { cart } };
    }
    async removeDiscount(req) {
        const cart = await this.cartService.removeDiscount(req.user.userId);
        return { success: true, data: { cart } };
    }
    async clearCart(req) {
        const result = await this.cartService.clearCart(req.user.userId);
        return result;
    }
    async calculateDelivery(req, body) {
        const result = await this.orderService.calculateDelivery(req.user.userId, body.addressId);
        return { success: true, data: result };
    }
    async createOrder(req, body) {
        const order = await this.orderService.createOrder(req.user.userId, body.addressId, body.paymentMethod, body.notes, body.discountCode, body.scheduleAt);
        return { success: true, data: { order } };
    }
    async processPayment(req, orderId, body) {
        const result = await this.orderService.processPayment(req.user.userId, orderId, body);
        return { success: true, data: result };
    }
    async getOrder(req, orderId) {
        const order = await this.orderService.getOrder(req.user.userId, orderId);
        return { success: true, data: { order } };
    }
    async getOrders(req, page, limit, status) {
        const result = await this.orderService.getOrders(req.user.userId, parseInt(page || '1'), parseInt(limit || '20'), status);
        return { success: true, data: result };
    }
    async cancelOrder(req, orderId, body) {
        const result = await this.orderService.cancelOrder(req.user.userId, orderId, body.reason);
        return result;
    }
    async rateOrder(req, orderId, body) {
        const result = await this.orderService.rateOrder(req.user.userId, orderId, body.rating, body.comment);
        return { success: true, data: result };
    }
    async reorder(req, orderId) {
        const result = await this.orderService.reorder(req.user.userId, orderId);
        return result;
    }
    async createStore(req, body) {
        const store = await this.vendorService.createStore(req.user.userId, body);
        return { success: true, data: { store } };
    }
    async updateStore(req, storeId, body) {
        const store = await this.vendorService.updateStore(req.user.userId, storeId, body);
        return { success: true, data: { store } };
    }
    async pauseStore(req, storeId, body) {
        const result = await this.vendorService.pauseStore(req.user.userId, storeId, body.paused);
        return result;
    }
    async getStoreAdmin(req, storeId) {
        const store = await this.vendorService.getStoreAdmin(req.user.userId, storeId);
        return { success: true, data: { store } };
    }
    async createProduct(req, storeId, body) {
        const product = await this.vendorService.createProduct(req.user.userId, storeId, body);
        return { success: true, data: { product } };
    }
    async updateProduct(req, storeId, productId, body) {
        const product = await this.vendorService.updateProduct(req.user.userId, storeId, productId, body);
        return { success: true, data: { product } };
    }
    async updateProductPricing(req, storeId, productId, body) {
        const result = await this.vendorService.updateProductPricing(req.user.userId, storeId, productId, body);
        return { success: true, data: result };
    }
    async updateProductInventory(req, storeId, productId, body) {
        const result = await this.vendorService.updateProductInventory(req.user.userId, storeId, productId, body);
        return { success: true, data: result };
    }
    async deleteProduct(req, storeId, productId) {
        const result = await this.vendorService.deleteProduct(req.user.userId, storeId, productId);
        return result;
    }
    async getStoreOrders(req, storeId, page, limit, status) {
        const result = await this.vendorService.getStoreOrders(req.user.userId, storeId, parseInt(page || '1'), parseInt(limit || '20'), status);
        return { success: true, data: result };
    }
    async getPromotions(category) {
        const promotions = await this.promotionService.getPromotions(category);
        return { success: true, data: { promotions } };
    }
    async createGiftCard(req, body) {
        const giftCard = await this.promotionService.createGiftCard(req.user.userId, body.amount, body.recipientEmail, body.recipientPhone, body.message, body.designId);
        return { success: true, data: { giftCard } };
    }
    async getGiftCardDesigns() {
        const designs = await this.promotionService.getGiftCardDesigns();
        return { success: true, data: { designs } };
    }
    async getGiftCardHistory(req) {
        const history = await this.promotionService.getGiftCardHistory(req.user.userId);
        return { success: true, data: history };
    }
    async redeemGiftCard(req, body) {
        const result = await this.promotionService.redeemGiftCard(req.user.userId, body.code);
        return result;
    }
    async getProductReviews(productId, page, limit) {
        const result = await this.reviewService.getProductReviews(productId, parseInt(page || '1'), parseInt(limit || '20'));
        return { success: true, data: result };
    }
    async addProductReview(req, productId, body) {
        const review = await this.reviewService.createProductReview(req.user.userId, productId, body.rating, body.comment, body.images);
        return { success: true, data: { review } };
    }
    async voteOnReview(req, reviewId, body) {
        return { success: true, message: 'Review vote recorded' };
    }
    async getStoreReviews(storeId, page, limit) {
        const result = await this.reviewService.getStoreReviews(storeId, parseInt(page || '1'), parseInt(limit || '20'));
        return { success: true, data: result };
    }
    async getStoreReviewSummary(storeId) {
        const summary = await this.reviewService.getStoreReviews(storeId);
        return { success: true, data: summary };
    }
    async toggleFavorite(req, body) {
        const result = await this.reviewService.toggleFavorite(req.user.userId, body.productId);
        return result;
    }
    async getFavorites(req, page, limit) {
        const result = await this.reviewService.getFavorites(req.user.userId, parseInt(page || '1'), parseInt(limit || '20'));
        return { success: true, data: result };
    }
    async toggleWishlist(req, body) {
        const result = await this.reviewService.addToWishlist(req.user.userId, body.productId, body.note);
        return result;
    }
    async getWishlist(req, page, limit) {
        const result = await this.reviewService.getWishlist(req.user.userId, parseInt(page || '1'), parseInt(limit || '20'));
        return { success: true, data: result };
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories/:categoryId/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by category' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCategoryProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('brands'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all brands' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getBrands", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('brands/:brandId/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get products by brand' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false }),
    __param(0, (0, common_1.Param)('brandId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getBrandProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "searchProducts", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product details' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getProduct", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all stores' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStores", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/:storeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store details' }),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStore", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/:storeId/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store products' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false }),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStoreProducts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/cart/add'),
    (0, swagger_1.ApiOperation)({ summary: 'Add item to cart' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "addToCart", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Put)('customer/cart/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update cart item' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateCartItem", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Delete)('customer/cart/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove cart item' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "removeCartItem", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Get)('customer/cart'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getCart", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/cart/apply-discount'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply discount code' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "applyDiscount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Delete)('customer/cart/remove-discount'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove discount' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "removeDiscount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/cart/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear cart' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "clearCart", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/checkout/calculate-delivery'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate delivery fee' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "calculateDelivery", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Create order' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/orders/:orderId/process-payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "processPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Get)('customer/orders/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order details' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Get)('customer/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order history' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/orders/:orderId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel order' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/orders/:orderId/rate'),
    (0, swagger_1.ApiOperation)({ summary: 'Rate order' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "rateOrder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/orders/:orderId/reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "reorder", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Post)('vendor/stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Create store' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createStore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Patch)('vendor/stores/:storeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update store' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateStore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Post)('vendor/stores/:storeId/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pause/unpause store' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "pauseStore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Get)('vendor/stores/:storeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store admin view' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStoreAdmin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Post)('vendor/stores/:storeId/products'),
    (0, swagger_1.ApiOperation)({ summary: 'Create product' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createProduct", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Patch)('vendor/stores/:storeId/products/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('productId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Patch)('vendor/stores/:storeId/products/:productId/pricing'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product pricing' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('productId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateProductPricing", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Patch)('vendor/stores/:storeId/products/:productId/inventory'),
    (0, swagger_1.ApiOperation)({ summary: 'Update product inventory' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('productId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateProductInventory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Delete)('vendor/stores/:storeId/products/:productId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete product' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDOR'),
    (0, common_1.Get)('vendor/stores/:storeId/orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store orders' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStoreOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('customer/promotions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get promotions' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getPromotions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/gifts'),
    (0, swagger_1.ApiOperation)({ summary: 'Create gift card' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createGiftCard", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('customer/gifts/designs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get gift card designs' }),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getGiftCardDesigns", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('customer/gifts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get gift card history' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getGiftCardHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('customer/gifts/redeem'),
    (0, swagger_1.ApiOperation)({ summary: 'Redeem gift card' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "redeemGiftCard", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('products/:productId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getProductReviews", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('products/:productId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Add product review' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "addProductReview", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('products/reviews/:reviewId/vote'),
    (0, swagger_1.ApiOperation)({ summary: 'Vote on review' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('reviewId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "voteOnReview", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/:storeId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStoreReviews", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('stores/:storeId/reviews/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store review summary' }),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getStoreReviewSummary", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/favorites/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle favorite' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Get)('customer/favorites'),
    (0, swagger_1.ApiOperation)({ summary: 'Get favorites' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Post)('customer/wishlist/toggle'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle wishlist' }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "toggleWishlist", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'VENDOR'),
    (0, common_1.Get)('customer/wishlist'),
    (0, swagger_1.ApiOperation)({ summary: 'Get wishlist' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getWishlist", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, swagger_1.ApiTags)('Marketplace'),
    (0, common_1.Controller)('marketplace'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService,
        cart_service_1.CartService,
        order_service_1.OrderService,
        vendor_service_1.VendorService,
        promotion_service_1.PromotionService,
        review_service_1.ReviewService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map