import { Injectable } from '@nestjs/common';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { Price } from '../value-objects/price.vo';
import { PricingService } from './pricing.service';

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CartMergeOptions {
  strategy: 'replace' | 'merge' | 'keep_existing';
  handleDuplicates: 'sum_quantities' | 'keep_higher' | 'keep_lower';
  preserveGuestCart: boolean;
}

export interface CartItemValidation {
  isValid: boolean;
  availableQuantity: number;
  maxQuantity: number;
  minQuantity: number;
  errors: string[];
}

export interface CartOptimization {
  suggestedItems: Array<{
    productId: string;
    reason: 'frequently_bought_together' | 'recommended' | 'discount_eligible';
    discount?: number;
  }>;
  removableItems: Array<{
    itemId: string;
    reason: 'out_of_stock' | 'discontinued' | 'price_changed';
  }>;
  bundleOpportunities: Array<{
    items: string[];
    bundleDiscount: number;
    savings: Price;
  }>;
}

@Injectable()
export class CartService {
  constructor(private readonly pricingService: PricingService) {}

  // Cart Creation and Management
  async createCart(userId: string, storeId?: string): Promise<Cart> {
    return Cart.create({
      userId,
      storeId,
      items: [],
      status: 'active',
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async addItemToCart(
    cart: Cart,
    product: Product,
    quantity: number,
    variantId?: string,
    customizations?: Record<string, any>
  ): Promise<Cart> {
    // Validate item can be added
    const validation = await this.validateCartItem(product, quantity, variantId);
    if (!validation.isValid) {
      throw new Error(`Cannot add item to cart: ${validation.errors.join(', ')}`);
    }

    // Check if item already exists in cart
    const existingItem = cart.findItem(product.id, variantId);
    
    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + quantity;
      const itemValidation = await this.validateCartItem(product, newQuantity, variantId);
      
      if (!itemValidation.isValid) {
        throw new Error(`Cannot update item quantity: ${itemValidation.errors.join(', ')}`);
      }
      
      return cart.updateItemQuantity(existingItem.id, newQuantity);
    } else {
      // Add new item
      const cartItem = CartItem.create({
        productId: product.id,
        variantId,
        quantity,
        unitPrice: product.price,
        customizations,
        addedAt: new Date()
      });
      
      return cart.addItem(cartItem);
    }
  }

  async updateItemQuantity(
    cart: Cart,
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    const item = cart.getItem(itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity <= 0) {
      return cart.removeItem(itemId);
    }

    // Validate new quantity
    const product = await this.getProduct(item.productId);
    const validation = await this.validateCartItem(product, quantity, item.variantId);
    
    if (!validation.isValid) {
      throw new Error(`Cannot update quantity: ${validation.errors.join(', ')}`);
    }

    return cart.updateItemQuantity(itemId, quantity);
  }

  async removeItemFromCart(cart: Cart, itemId: string): Promise<Cart> {
    return cart.removeItem(itemId);
  }

  async clearCart(cart: Cart): Promise<Cart> {
    return cart.clear();
  }

  // Cart Validation
  async validateCart(cart: Cart): Promise<CartValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (cart.isEmpty()) {
      errors.push('Cart is empty');
      return { isValid: false, errors, warnings };
    }

    // Validate each item
    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);
      const itemValidation = await this.validateCartItem(
        product,
        item.quantity,
        item.variantId
      );

      if (!itemValidation.isValid) {
        errors.push(`Item ${product.name}: ${itemValidation.errors.join(', ')}`);
      }

      // Check for warnings
      if (item.quantity > itemValidation.availableQuantity * 0.8) {
        warnings.push(`Low stock for ${product.name}`);
      }
    }

    // Validate cart totals
    const pricing = await this.pricingService.calculateCartPricing(cart);
    if (pricing.total.amount <= 0) {
      errors.push('Cart total must be greater than zero');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async validateCartItem(
    product: Product,
    quantity: number,
    variantId?: string
  ): Promise<CartItemValidation> {
    const errors: string[] = [];

    // Check product availability
    if (!product.isAvailableForPurchase()) {
      errors.push('Product is not available for purchase');
    }

    // Check stock
    const availableQuantity = product.getAvailableQuantity(variantId);
    if (quantity > availableQuantity) {
      errors.push(`Only ${availableQuantity} items available`);
    }

    // Check quantity limits
    const minQuantity = product.getMinOrderQuantity();
    const maxQuantity = product.getMaxOrderQuantity();

    if (quantity < minQuantity) {
      errors.push(`Minimum order quantity is ${minQuantity}`);
    }

    if (quantity > maxQuantity) {
      errors.push(`Maximum order quantity is ${maxQuantity}`);
    }

    // Check variant validity
    if (variantId && !product.hasVariant(variantId)) {
      errors.push('Invalid product variant');
    }

    return {
      isValid: errors.length === 0,
      availableQuantity,
      maxQuantity,
      minQuantity,
      errors
    };
  }

  // Cart Merging
  async mergeCarts(
    userCart: Cart,
    guestCart: Cart,
    options: CartMergeOptions = {
      strategy: 'merge',
      handleDuplicates: 'sum_quantities',
      preserveGuestCart: false
    }
  ): Promise<Cart> {
    if (options.strategy === 'replace') {
      return guestCart;
    }

    if (options.strategy === 'keep_existing') {
      return userCart;
    }

    // Merge strategy
    const mergedCart = userCart.clone();

    for (const guestItem of guestCart.items) {
      const existingItem = mergedCart.findItem(
        guestItem.productId,
        guestItem.variantId
      );

      if (existingItem) {
        // Handle duplicates
        let newQuantity: number;
        
        switch (options.handleDuplicates) {
          case 'sum_quantities':
            newQuantity = existingItem.quantity + guestItem.quantity;
            break;
          case 'keep_higher':
            newQuantity = Math.max(existingItem.quantity, guestItem.quantity);
            break;
          case 'keep_lower':
            newQuantity = Math.min(existingItem.quantity, guestItem.quantity);
            break;
        }

        // Validate merged quantity
        const product = await this.getProduct(guestItem.productId);
        const validation = await this.validateCartItem(
          product,
          newQuantity,
          guestItem.variantId
        );

        if (validation.isValid) {
          mergedCart.updateItemQuantity(existingItem.id, newQuantity);
        }
      } else {
        // Add new item from guest cart
        const product = await this.getProduct(guestItem.productId);
        const validation = await this.validateCartItem(
          product,
          guestItem.quantity,
          guestItem.variantId
        );

        if (validation.isValid) {
          mergedCart.addItem(guestItem);
        }
      }
    }

    return mergedCart;
  }

  // Cart Optimization
  async optimizeCart(cart: Cart): Promise<CartOptimization> {
    const suggestedItems: CartOptimization['suggestedItems'] = [];
    const removableItems: CartOptimization['removableItems'] = [];
    const bundleOpportunities: CartOptimization['bundleOpportunities'] = [];

    // Check for items that should be removed
    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);
      
      if (!product.isAvailableForPurchase()) {
        removableItems.push({
          itemId: item.id,
          reason: product.status === 'out_of_stock' ? 'out_of_stock' : 'discontinued'
        });
      }
    }

    // Find frequently bought together items
    const productIds = cart.items.map(item => item.productId);
    const recommendations = await this.getFrequentlyBoughtTogether(productIds);
    
    for (const rec of recommendations) {
      if (!cart.hasProduct(rec.productId)) {
        suggestedItems.push({
          productId: rec.productId,
          reason: 'frequently_bought_together'
        });
      }
    }

    // Find bundle opportunities
    const bundles = await this.findBundleOpportunities(productIds);
    bundleOpportunities.push(...bundles);

    return {
      suggestedItems,
      removableItems,
      bundleOpportunities
    };
  }

  // Cart Calculations
  async calculateCartTotals(cart: Cart): Promise<{
    subtotal: Price;
    tax: Price;
    shipping: Price;
    discount: Price;
    total: Price;
  }> {
    const pricing = await this.pricingService.calculateCartPricing(cart);
    
    return {
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shipping: pricing.shipping,
      discount: pricing.discount,
      total: pricing.total
    };
  }

  // Cart State Management
  async activateCart(cart: Cart): Promise<Cart> {
    return cart.activate();
  }

  async deactivateCart(cart: Cart): Promise<Cart> {
    return cart.deactivate();
  }

  async abandonCart(cart: Cart): Promise<Cart> {
    return cart.abandon();
  }

  async recoverCart(cart: Cart): Promise<Cart> {
    // Validate cart is still recoverable
    const validation = await this.validateCart(cart);
    
    if (validation.isValid) {
      return cart.activate();
    } else {
      // Clean up invalid items and try again
      const cleanedCart = await this.cleanupCart(cart);
      return cleanedCart.activate();
    }
  }

  // Helper Methods
  private async cleanupCart(cart: Cart): Promise<Cart> {
    const cleanedCart = cart.clone();
    const itemsToRemove: string[] = [];

    for (const item of cleanedCart.items) {
      const product = await this.getProduct(item.productId);
      const validation = await this.validateCartItem(
        product,
        item.quantity,
        item.variantId
      );

      if (!validation.isValid) {
        itemsToRemove.push(item.id);
      }
    }

    for (const itemId of itemsToRemove) {
      cleanedCart.removeItem(itemId);
    }

    return cleanedCart;
  }

  private async getProduct(productId: string): Promise<Product> {
    // This would typically call a product repository
    // For now, we'll throw an error to indicate this needs to be implemented
    throw new Error('Product repository integration needed');
  }

  private async getFrequentlyBoughtTogether(productIds: string[]): Promise<Array<{ productId: string; score: number }>> {
    // This would typically call an analytics service
    // For now, return empty array
    return [];
  }

  private async findBundleOpportunities(productIds: string[]): Promise<CartOptimization['bundleOpportunities']> {
    // This would typically call a promotion service to find bundle deals
    // For now, return empty array
    return [];
  }

  // Cart Conversion
  async prepareCartForCheckout(cart: Cart): Promise<{
    cart: Cart;
    validation: CartValidationResult;
    pricing: any;
  }> {
    // Final validation before checkout
    const validation = await this.validateCart(cart);
    
    if (!validation.isValid) {
      throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate final pricing
    const pricing = await this.pricingService.calculateCartPricing(cart);

    // Update cart status
    const checkoutCart = cart.prepareForCheckout();

    return {
      cart: checkoutCart,
      validation,
      pricing
    };
  }

  // Cart Analytics
  getCartMetrics(cart: Cart): {
    itemCount: number;
    uniqueProducts: number;
    averageItemPrice: Price;
    cartAge: number; // in hours
  } {
    const itemCount = cart.getTotalItems();
    const uniqueProducts = cart.getUniqueProductCount();
    const totalValue = cart.getSubtotal();
    const averageItemPrice = new Price(
      totalValue.amount / itemCount,
      totalValue.currency
    );
    const cartAge = Math.floor(
      (Date.now() - cart.createdAt.getTime()) / (1000 * 60 * 60)
    );

    return {
      itemCount,
      uniqueProducts,
      averageItemPrice,
      cartAge
    };
  }
}