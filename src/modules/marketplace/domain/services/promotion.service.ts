import { Injectable } from '@nestjs/common';
import { Promotion } from '../entities/promotion.entity';
import { Cart } from '../entities/cart.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { Price } from '../value-objects/price.vo';
import { PromotionDetails } from '../value-objects/promotion-details.vo';

export interface PromotionEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  requirements: {
    met: string[];
    unmet: string[];
  };
  potentialSavings?: Price;
}

export interface PromotionApplicationResult {
  success: boolean;
  discountAmount: Price;
  appliedPromotion: Promotion;
  affectedItems: string[];
  message: string;
  errors?: string[];
}

export interface PromotionValidationResult {
  isValid: boolean;
  canUse: boolean;
  errors: string[];
  warnings: string[];
  usageInfo: {
    timesUsed: number;
    remainingUses: number;
    isExpired: boolean;
    isActive: boolean;
  };
}

export interface PromotionConflictCheck {
  hasConflicts: boolean;
  conflicts: Array<{
    promotionId: string;
    conflictType: 'exclusive' | 'category' | 'product' | 'user_limit';
    description: string;
  }>;
  resolution: 'allow_all' | 'highest_discount' | 'first_applied' | 'manual_selection';
}

export interface PromotionRecommendation {
  promotionId: string;
  type: 'better_deal' | 'additional_savings' | 'bundle_opportunity';
  description: string;
  potentialSavings: Price;
  requirements: string[];
}

export interface PromotionUsageContext {
  userId: string;
  cart?: Cart;
  order?: Order;
  customerSegment?: string;
  loyaltyTier?: string;
  previousPurchases?: number;
  accountAge?: number; // in days
  isFirstTime?: boolean;
}

@Injectable()
export class PromotionService {
  // Promotion Validation
  async validatePromotion(
    promotion: Promotion,
    context: PromotionUsageContext
  ): Promise<PromotionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if promotion is active
    if (!promotion.isActive()) {
      errors.push('Promotion is not active');
    }

    // Check expiration
    const isExpired = promotion.isExpired();
    if (isExpired) {
      errors.push('Promotion has expired');
    }

    // Check start date
    if (!promotion.hasStarted()) {
      errors.push('Promotion has not started yet');
    }

    // Check usage limits
    const usageInfo = await this.getPromotionUsageInfo(promotion, context.userId);
    
    if (promotion.hasGlobalUsageLimit() && usageInfo.timesUsed >= promotion.getGlobalUsageLimit()) {
      errors.push('Promotion usage limit exceeded');
    }

    if (promotion.hasUserUsageLimit() && usageInfo.timesUsed >= promotion.getUserUsageLimit()) {
      errors.push('You have reached the usage limit for this promotion');
    }

    // Check minimum requirements
    if (context.cart) {
      const eligibility = await this.checkEligibility(promotion, context);
      if (!eligibility.isEligible) {
        errors.push(...eligibility.reasons);
      }
    }

    // Add warnings for near-expiry
    if (!isExpired && promotion.expiresWithin(24 * 60 * 60 * 1000)) { // 24 hours
      warnings.push('Promotion expires soon');
    }

    return {
      isValid: errors.length === 0,
      canUse: errors.length === 0,
      errors,
      warnings,
      usageInfo: {
        timesUsed: usageInfo.timesUsed,
        remainingUses: Math.max(0, promotion.getUserUsageLimit() - usageInfo.timesUsed),
        isExpired,
        isActive: promotion.isActive()
      }
    };
  }

  // Promotion Eligibility
  async checkEligibility(
    promotion: Promotion,
    context: PromotionUsageContext
  ): Promise<PromotionEligibilityResult> {
    const reasons: string[] = [];
    const metRequirements: string[] = [];
    const unmetRequirements: string[] = [];

    if (!context.cart) {
      reasons.push('Cart is required for eligibility check');
      return {
        isEligible: false,
        reasons,
        requirements: { met: metRequirements, unmet: unmetRequirements }
      };
    }

    const cart = context.cart;
    const details = promotion.details;

    // Check minimum order amount
    if (details.minimumOrderAmount) {
      const cartTotal = cart.getSubtotal();
      if (cartTotal.amount >= details.minimumOrderAmount.amount) {
        metRequirements.push(`Minimum order amount: ${details.minimumOrderAmount.format()}`);
      } else {
        unmetRequirements.push(`Minimum order amount: ${details.minimumOrderAmount.format()}`);
        reasons.push(`Order total must be at least ${details.minimumOrderAmount.format()}`);
      }
    }

    // Check minimum quantity
    if (details.minimumQuantity) {
      const totalQuantity = cart.getTotalItems();
      if (totalQuantity >= details.minimumQuantity) {
        metRequirements.push(`Minimum quantity: ${details.minimumQuantity} items`);
      } else {
        unmetRequirements.push(`Minimum quantity: ${details.minimumQuantity} items`);
        reasons.push(`Cart must contain at least ${details.minimumQuantity} items`);
      }
    }

    // Check applicable products
    if (details.applicableProducts && details.applicableProducts.length > 0) {
      const hasApplicableProducts = cart.items.some(item => 
        details.applicableProducts!.includes(item.productId)
      );
      
      if (hasApplicableProducts) {
        metRequirements.push('Contains applicable products');
      } else {
        unmetRequirements.push('Must contain applicable products');
        reasons.push('Cart must contain eligible products');
      }
    }

    // Check applicable categories
    if (details.applicableCategories && details.applicableCategories.length > 0) {
      const hasApplicableCategories = await this.cartHasProductsInCategories(
        cart,
        details.applicableCategories
      );
      
      if (hasApplicableCategories) {
        metRequirements.push('Contains products from applicable categories');
      } else {
        unmetRequirements.push('Must contain products from applicable categories');
        reasons.push('Cart must contain products from eligible categories');
      }
    }

    // Check excluded products
    if (details.excludedProducts && details.excludedProducts.length > 0) {
      const hasExcludedProducts = cart.items.some(item => 
        details.excludedProducts!.includes(item.productId)
      );
      
      if (!hasExcludedProducts) {
        metRequirements.push('No excluded products');
      } else {
        unmetRequirements.push('Contains excluded products');
        reasons.push('Cart contains products that are not eligible for this promotion');
      }
    }

    // Check customer eligibility
    if (details.eligibleCustomerSegments && details.eligibleCustomerSegments.length > 0) {
      if (context.customerSegment && details.eligibleCustomerSegments.includes(context.customerSegment)) {
        metRequirements.push('Customer segment eligible');
      } else {
        unmetRequirements.push('Customer segment not eligible');
        reasons.push('This promotion is not available for your customer segment');
      }
    }

    // Check first-time customer requirement
    if (details.firstTimeCustomerOnly && !context.isFirstTime) {
      unmetRequirements.push('First-time customer only');
      reasons.push('This promotion is only available for first-time customers');
    }

    // Calculate potential savings
    let potentialSavings: Price | undefined;
    if (reasons.length === 0) {
      potentialSavings = await this.calculateDiscount(promotion, cart);
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
      requirements: {
        met: metRequirements,
        unmet: unmetRequirements
      },
      potentialSavings
    };
  }

  // Promotion Application
  async applyPromotion(
    promotion: Promotion,
    cart: Cart,
    context: PromotionUsageContext
  ): Promise<PromotionApplicationResult> {
    // Validate promotion first
    const validation = await this.validatePromotion(promotion, context);
    if (!validation.isValid) {
      return {
        success: false,
        discountAmount: new Price(0, cart.currency),
        appliedPromotion: promotion,
        affectedItems: [],
        message: 'Promotion is not valid',
        errors: validation.errors
      };
    }

    // Check eligibility
    const eligibility = await this.checkEligibility(promotion, context);
    if (!eligibility.isEligible) {
      return {
        success: false,
        discountAmount: new Price(0, cart.currency),
        appliedPromotion: promotion,
        affectedItems: [],
        message: 'Not eligible for this promotion',
        errors: eligibility.reasons
      };
    }

    // Calculate discount
    const discountAmount = await this.calculateDiscount(promotion, cart);
    const affectedItems = await this.getAffectedItems(promotion, cart);

    // Apply the discount to cart (this would modify the cart)
    // For now, we'll just return the result

    return {
      success: true,
      discountAmount,
      appliedPromotion: promotion,
      affectedItems,
      message: `Promotion applied successfully! You saved ${discountAmount.format()}`
    };
  }

  // Discount Calculation
  async calculateDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    const details = promotion.details;
    let discountAmount = new Price(0, cart.currency);

    switch (details.type) {
      case 'percentage':
        discountAmount = await this.calculatePercentageDiscount(promotion, cart);
        break;
      case 'fixed_amount':
        discountAmount = await this.calculateFixedAmountDiscount(promotion, cart);
        break;
      case 'buy_x_get_y':
        discountAmount = await this.calculateBuyXGetYDiscount(promotion, cart);
        break;
      case 'free_shipping':
        discountAmount = await this.calculateFreeShippingDiscount(promotion, cart);
        break;
      case 'bundle':
        discountAmount = await this.calculateBundleDiscount(promotion, cart);
        break;
      default:
        throw new Error(`Unsupported promotion type: ${details.type}`);
    }

    // Apply maximum discount limit
    if (details.maxDiscountAmount && discountAmount.amount > details.maxDiscountAmount.amount) {
      discountAmount = details.maxDiscountAmount;
    }

    return discountAmount;
  }

  private async calculatePercentageDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    const details = promotion.details;
    const discountPercentage = details.discountPercentage || 0;
    
    let applicableAmount = new Price(0, cart.currency);
    
    if (details.applicableProducts && details.applicableProducts.length > 0) {
      // Apply to specific products only
      for (const item of cart.items) {
        if (details.applicableProducts.includes(item.productId)) {
          applicableAmount = applicableAmount.add(
            new Price(item.unitPrice.amount * item.quantity, item.unitPrice.currency)
          );
        }
      }
    } else {
      // Apply to entire cart
      applicableAmount = cart.getSubtotal();
    }
    
    return new Price(
      applicableAmount.amount * (discountPercentage / 100),
      cart.currency
    );
  }

  private async calculateFixedAmountDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    const details = promotion.details;
    return details.discountAmount || new Price(0, cart.currency);
  }

  private async calculateBuyXGetYDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    const details = promotion.details;
    const buyQuantity = details.buyQuantity || 0;
    const getQuantity = details.getQuantity || 0;
    const getDiscountPercentage = details.getDiscountPercentage || 100; // Default to free
    
    let discountAmount = new Price(0, cart.currency);
    
    if (details.applicableProducts && details.applicableProducts.length > 0) {
      for (const productId of details.applicableProducts) {
        const item = cart.items.find(i => i.productId === productId);
        if (item && item.quantity >= buyQuantity) {
          const freeItems = Math.floor(item.quantity / buyQuantity) * getQuantity;
          const discountPerItem = item.unitPrice.amount * (getDiscountPercentage / 100);
          discountAmount = discountAmount.add(
            new Price(freeItems * discountPerItem, item.unitPrice.currency)
          );
        }
      }
    }
    
    return discountAmount;
  }

  private async calculateFreeShippingDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    // This would typically get the shipping cost from a shipping service
    // For now, return a placeholder amount
    return new Price(9.99, cart.currency);
  }

  private async calculateBundleDiscount(promotion: Promotion, cart: Cart): Promise<Price> {
    const details = promotion.details;
    
    if (!details.bundleProducts || details.bundleProducts.length === 0) {
      return new Price(0, cart.currency);
    }
    
    // Check if all bundle products are in cart
    const hasBundleProducts = details.bundleProducts.every(productId => 
      cart.items.some(item => item.productId === productId)
    );
    
    if (!hasBundleProducts) {
      return new Price(0, cart.currency);
    }
    
    // Calculate bundle discount
    let bundleTotal = new Price(0, cart.currency);
    for (const productId of details.bundleProducts) {
      const item = cart.items.find(i => i.productId === productId);
      if (item) {
        bundleTotal = bundleTotal.add(
          new Price(item.unitPrice.amount * item.quantity, item.unitPrice.currency)
        );
      }
    }
    
    if (details.bundleDiscountPercentage) {
      return new Price(
        bundleTotal.amount * (details.bundleDiscountPercentage / 100),
        cart.currency
      );
    } else if (details.bundleDiscountAmount) {
      return details.bundleDiscountAmount;
    }
    
    return new Price(0, cart.currency);
  }

  // Promotion Conflicts
  async checkPromotionConflicts(
    promotions: Promotion[],
    context: PromotionUsageContext
  ): Promise<PromotionConflictCheck> {
    const conflicts: PromotionConflictCheck['conflicts'] = [];
    
    // Check for exclusive promotions
    const exclusivePromotions = promotions.filter(p => p.details.isExclusive);
    if (exclusivePromotions.length > 1) {
      for (let i = 1; i < exclusivePromotions.length; i++) {
        conflicts.push({
          promotionId: exclusivePromotions[i].id,
          conflictType: 'exclusive',
          description: 'Cannot be combined with other exclusive promotions'
        });
      }
    }
    
    // Check for overlapping product/category restrictions
    for (let i = 0; i < promotions.length; i++) {
      for (let j = i + 1; j < promotions.length; j++) {
        const promo1 = promotions[i];
        const promo2 = promotions[j];
        
        if (this.hasProductOverlap(promo1, promo2)) {
          conflicts.push({
            promotionId: promo2.id,
            conflictType: 'product',
            description: 'Applies to the same products as another promotion'
          });
        }
      }
    }
    
    let resolution: PromotionConflictCheck['resolution'] = 'allow_all';
    if (conflicts.length > 0) {
      resolution = exclusivePromotions.length > 0 ? 'first_applied' : 'highest_discount';
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolution
    };
  }

  // Promotion Recommendations
  async getPromotionRecommendations(
    context: PromotionUsageContext
  ): Promise<PromotionRecommendation[]> {
    const recommendations: PromotionRecommendation[] = [];
    
    if (!context.cart) {
      return recommendations;
    }
    
    // This would typically query available promotions and suggest better deals
    // For now, return empty array
    return recommendations;
  }

  // Helper Methods
  private async getPromotionUsageInfo(
    promotion: Promotion,
    userId: string
  ): Promise<{ timesUsed: number }> {
    // This would typically query the database for usage statistics
    // For now, return placeholder data
    return { timesUsed: 0 };
  }

  private async cartHasProductsInCategories(
    cart: Cart,
    categoryIds: string[]
  ): Promise<boolean> {
    // This would typically check product categories
    // For now, return true
    return true;
  }

  private async getAffectedItems(promotion: Promotion, cart: Cart): Promise<string[]> {
    const details = promotion.details;
    
    if (details.applicableProducts && details.applicableProducts.length > 0) {
      return cart.items
        .filter(item => details.applicableProducts!.includes(item.productId))
        .map(item => item.id);
    }
    
    // If no specific products, all items are affected
    return cart.items.map(item => item.id);
  }

  private hasProductOverlap(promo1: Promotion, promo2: Promotion): boolean {
    const products1 = promo1.details.applicableProducts || [];
    const products2 = promo2.details.applicableProducts || [];
    
    if (products1.length === 0 || products2.length === 0) {
      return true; // If either applies to all products, there's overlap
    }
    
    return products1.some(p => products2.includes(p));
  }

  // Promotion Code Validation
  async validatePromotionCode(code: string): Promise<Promotion | null> {
    // This would typically query the database for the promotion by code
    // For now, return null
    return null;
  }

  // Promotion Analytics
  async trackPromotionUsage(
    promotion: Promotion,
    context: PromotionUsageContext,
    discountAmount: Price
  ): Promise<void> {
    // This would typically log promotion usage for analytics
    // Implementation would depend on analytics service
  }

  async getPromotionPerformance(promotionId: string): Promise<{
    totalUses: number;
    totalDiscount: Price;
    conversionRate: number;
    averageOrderValue: Price;
  }> {
    // This would typically query analytics data
    // For now, return placeholder data
    return {
      totalUses: 0,
      totalDiscount: new Price(0, 'USD'),
      conversionRate: 0,
      averageOrderValue: new Price(0, 'USD')
    };
  }
}