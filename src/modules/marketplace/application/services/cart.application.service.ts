import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartService } from '../../domain/services/cart.service';
import { PricingService } from '../../domain/services/pricing.service';

export interface AddToCartData {
  productId: string;
  quantity: number;
  variantOptions?: Record<string, string>;
}

export interface UpdateCartItemData {
  quantity: number;
  variantOptions?: Record<string, string>;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discounts: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  appliedPromotions: Array<{
    id: string;
    code: string;
    discount: number;
    type: string;
  }>;
  estimatedDelivery?: Date;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: Array<{
    itemId?: string;
    productId?: string;
    message: string;
    type: 'stock' | 'price' | 'availability' | 'variant';
  }>;
  warnings: Array<{
    itemId?: string;
    productId?: string;
    message: string;
    type: 'stock_low' | 'price_change' | 'promotion_expired';
  }>;
}

export interface CartMergeResult {
  mergedCart: Cart;
  conflictItems: Array<{
    existingItem: CartItem;
    newItem: CartItem;
    resolution: 'merged' | 'replaced' | 'kept_existing';
  }>;
}

export interface CartRecommendations {
  suggestedItems: Array<{
    product: any; // Product entity
    reason: string;
    priority: number;
  }>;
  bundleOpportunities: Array<{
    products: any[]; // Product entities
    discount: number;
    savings: number;
  }>;
  freeShippingThreshold?: {
    current: number;
    required: number;
    remaining: number;
  };
}

@Injectable()
export class CartApplicationService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly cartService: CartService,
    private readonly pricingService: PricingService,
  ) {}

  // Cart Management
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(userId);
    
    if (!cart) {
      cart = await this.cartService.createCart(userId);
      cart = await this.cartRepository.create(cart);
    }

    return cart;
  }

  async getCart(userId: string): Promise<Cart | null> {
    return await this.cartRepository.findByUserId(userId);
  }

  async addToCart(userId: string, data: AddToCartData): Promise<Cart> {
    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Validate product exists and is available
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive()) {
      throw new BadRequestException('Product is not available');
    }

    if (product.getStock() < data.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Add item to cart using domain service
    const validationResult = await this.cartService.addItem(
      cart,
      data.productId,
      data.quantity,
      data.variantOptions,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.errors[0]?.message || 'Failed to add item to cart');
    }

    // Save updated cart
    return await this.cartRepository.update(cart);
  }

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemData): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Validate product stock
    const item = cart.getItems().find(item => item.getId() === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.productRepository.findById(item.getProductId());
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.getStock() < data.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Update item using domain service
    const validationResult = await this.cartService.updateItem(
      cart,
      itemId,
      data.quantity,
      data.variantOptions,
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.errors[0]?.message || 'Failed to update cart item');
    }

    return await this.cartRepository.update(cart);
  }

  async removeFromCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Remove item using domain service
    await this.cartService.removeItem(cart, itemId);

    return await this.cartRepository.update(cart);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Clear cart using domain service
    await this.cartService.clearCart(cart);

    return await this.cartRepository.update(cart);
  }

  // Cart Validation
  async validateCart(userId: string): Promise<CartValidationResult> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return {
        isValid: false,
        errors: [{ message: 'Cart not found', type: 'availability' }],
        warnings: [],
      };
    }

    return await this.cartService.validateCart(cart);
  }

  // Cart Calculations
  async getCartSummary(userId: string, promotionCodes?: string[]): Promise<CartSummary> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Calculate pricing using domain service
    const pricingContext = {
      userId,
      cartItems: cart.getItems().map(item => ({
        productId: item.getProductId(),
        quantity: item.getQuantity(),
        variantOptions: item.getVariantOptions(),
      })),
      promotionCodes: promotionCodes || [],
      deliveryAddress: null, // Would come from user's default address
    };

    const pricing = await this.pricingService.calculateCartPricing(pricingContext);

    return {
      itemCount: cart.getItemCount(),
      subtotal: pricing.subtotal,
      discounts: pricing.totalDiscount,
      tax: pricing.tax,
      shipping: pricing.shipping,
      total: pricing.total,
      currency: pricing.currency,
      appliedPromotions: pricing.appliedPromotions.map(promo => ({
        id: promo.promotionId,
        code: promo.code,
        discount: promo.discount,
        type: promo.type,
      })),
      estimatedDelivery: pricing.estimatedDelivery,
    };
  }

  // Cart Merging (for guest to user conversion)
  async mergeCarts(userId: string, guestCartId: string, strategy: 'merge' | 'replace' | 'keep_existing' = 'merge'): Promise<CartMergeResult> {
    const userCart = await this.getOrCreateCart(userId);
    const guestCart = await this.cartRepository.findById(guestCartId);

    if (!guestCart) {
      throw new NotFoundException('Guest cart not found');
    }

    const mergeOptions = {
      strategy,
      preserveQuantities: strategy === 'merge',
      validateStock: true,
    };

    const result = await this.cartService.mergeCarts(userCart, guestCart, mergeOptions);

    // Save merged cart
    const mergedCart = await this.cartRepository.update(result.mergedCart);

    // Delete guest cart
    await this.cartRepository.delete(guestCartId);

    return {
      mergedCart,
      conflictItems: result.conflictItems,
    };
  }

  // Cart Recommendations
  async getCartRecommendations(userId: string): Promise<CartRecommendations> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return {
        suggestedItems: [],
        bundleOpportunities: [],
      };
    }

    const optimization = await this.cartService.optimizeCart(cart);

    // Get product details for recommendations
    const suggestedProductIds = optimization.suggestedItems.map(item => item.productId);
    const suggestedProducts = await this.productRepository.findByIds(suggestedProductIds);

    const bundleProductIds = optimization.bundleOpportunities.flatMap(bundle => bundle.productIds);
    const bundleProducts = await this.productRepository.findByIds(bundleProductIds);

    return {
      suggestedItems: optimization.suggestedItems.map(item => {
        const product = suggestedProducts.find(p => p.getId() === item.productId);
        return {
          product,
          reason: item.reason,
          priority: item.priority,
        };
      }),
      bundleOpportunities: optimization.bundleOpportunities.map(bundle => {
        const products = bundle.productIds.map(id => 
          bundleProducts.find(p => p.getId() === id)
        ).filter(Boolean);
        return {
          products,
          discount: bundle.discount,
          savings: bundle.savings,
        };
      }),
      freeShippingThreshold: optimization.freeShippingThreshold,
    };
  }

  // Cart State Management
  async activateCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartService.activateCart(cart);
    return await this.cartRepository.update(cart);
  }

  async deactivateCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartService.deactivateCart(cart);
    return await this.cartRepository.update(cart);
  }

  async abandonCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartService.abandonCart(cart);
    return await this.cartRepository.update(cart);
  }

  async recoverCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.cartService.recoverCart(cart);
    return await this.cartRepository.update(cart);
  }

  // Checkout Preparation
  async prepareForCheckout(userId: string): Promise<{
    cart: Cart;
    validation: CartValidationResult;
    summary: CartSummary;
    recommendations?: CartRecommendations;
  }> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Validate cart
    const validation = await this.validateCart(userId);
    
    // Get cart summary
    const summary = await this.getCartSummary(userId);

    // Get recommendations if cart is valid
    let recommendations;
    if (validation.isValid) {
      recommendations = await this.getCartRecommendations(userId);
    }

    return {
      cart,
      validation,
      summary,
      recommendations,
    };
  }

  // Cart Analytics
  async getCartAnalytics(userId: string): Promise<{
    totalValue: number;
    itemCount: number;
    averageItemValue: number;
    cartAge: number; // in hours
    abandonmentRisk: 'low' | 'medium' | 'high';
    conversionProbability: number;
  }> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return await this.cartService.getCartAnalytics(cart);
  }

  // Bulk Operations
  async bulkAddToCart(userId: string, items: AddToCartData[]): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    for (const item of items) {
      // Validate each product
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isActive() || product.getStock() < item.quantity) {
        continue; // Skip invalid items
      }

      await this.cartService.addItem(
        cart,
        item.productId,
        item.quantity,
        item.variantOptions,
      );
    }

    return await this.cartRepository.update(cart);
  }

  async bulkRemoveFromCart(userId: string, itemIds: string[]): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    for (const itemId of itemIds) {
      await this.cartService.removeItem(cart, itemId);
    }

    return await this.cartRepository.update(cart);
  }

  // Helper Methods
  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.cartRepository.findByUserId(userId);
    return cart ? cart.getItemCount() : 0;
  }

  async isProductInCart(userId: string, productId: string): Promise<boolean> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) return false;

    return cart.getItems().some(item => item.getProductId() === productId);
  }

  async getCartValue(userId: string): Promise<number> {
    const summary = await this.getCartSummary(userId);
    return summary.total;
  }
}