import { Price } from '../value-objects/price.value-object';
import { Product } from '../entities/product.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Promotion } from '../entities/promotion.entity';

export interface PricingContext {
  userId?: string;
  storeId?: string;
  currency: string;
  region?: string;
  customerType?: 'regular' | 'premium' | 'wholesale';
  loyaltyTier?: string;
  appliedPromotions?: string[];
  taxRate?: number;
  shippingMethod?: string;
  deliveryAddress?: any;
}

export interface PriceBreakdown {
  subtotal: Price;
  discounts: Price;
  tax: Price;
  shipping: Price;
  total: Price;
  savings: Price;
  appliedPromotions: {
    code: string;
    type: string;
    discount: Price;
    description: string;
  }[];
}

export interface ProductPricing {
  basePrice: Price;
  salePrice?: Price;
  discountedPrice?: Price;
  finalPrice: Price;
  discount?: {
    amount: Price;
    percentage: number;
    type: string;
    reason: string;
  };
  priceHistory?: {
    price: Price;
    date: Date;
    reason: string;
  }[];
  competitorPrices?: {
    competitor: string;
    price: Price;
    url?: string;
  }[];
}

export interface ShippingCalculation {
  method: string;
  cost: Price;
  estimatedDays: number;
  carrier?: string;
  trackingAvailable: boolean;
  freeShippingThreshold?: Price;
  remainingForFreeShipping?: Price;
}

export interface TaxCalculation {
  rate: number;
  amount: Price;
  type: string;
  jurisdiction: string;
  exemptions?: string[];
  breakdown?: {
    federal?: Price;
    state?: Price;
    local?: Price;
    vat?: Price;
  };
}

export class PricingService {
  // Product pricing calculations
  calculateProductPrice(product: Product, context: PricingContext): ProductPricing {
    const basePrice = product.getPrice();
    let finalPrice = basePrice;
    let discount: ProductPricing['discount'] | undefined;

    // Apply customer type discounts
    if (context.customerType === 'wholesale' && product.getWholesalePrice()) {
      finalPrice = product.getWholesalePrice()!;
      discount = {
        amount: basePrice.subtract(finalPrice),
        percentage: this.calculateDiscountPercentage(basePrice, finalPrice),
        type: 'wholesale',
        reason: 'Wholesale pricing'
      };
    }

    // Apply sale price if available
    if (product.getSalePrice() && product.getSalePrice()!.isLessThan(finalPrice)) {
      const salePrice = product.getSalePrice()!;
      discount = {
        amount: finalPrice.subtract(salePrice),
        percentage: this.calculateDiscountPercentage(finalPrice, salePrice),
        type: 'sale',
        reason: 'Sale price'
      };
      finalPrice = salePrice;
    }

    // Apply loyalty tier discounts
    if (context.loyaltyTier) {
      const loyaltyDiscount = this.calculateLoyaltyDiscount(finalPrice, context.loyaltyTier);
      if (loyaltyDiscount.isGreaterThan(Price.zero(context.currency))) {
        const discountedPrice = finalPrice.subtract(loyaltyDiscount);
        discount = {
          amount: loyaltyDiscount,
          percentage: this.calculateDiscountPercentage(finalPrice, discountedPrice),
          type: 'loyalty',
          reason: `${context.loyaltyTier} tier discount`
        };
        finalPrice = discountedPrice;
      }
    }

    return {
      basePrice,
      salePrice: product.getSalePrice(),
      discountedPrice: discount ? finalPrice : undefined,
      finalPrice,
      discount
    };
  }

  // Cart pricing calculations
  calculateCartPricing(cart: Cart, context: PricingContext): PriceBreakdown {
    let subtotal = Price.zero(context.currency);
    const appliedPromotions: PriceBreakdown['appliedPromotions'] = [];

    // Calculate subtotal from all items
    for (const item of cart.getItems()) {
      const itemPricing = this.calculateCartItemPricing(item, context);
      subtotal = subtotal.add(itemPricing.total);
    }

    // Apply cart-level promotions
    let discounts = Price.zero(context.currency);
    if (context.appliedPromotions) {
      for (const promotionCode of context.appliedPromotions) {
        const promotionDiscount = this.calculatePromotionDiscount(
          promotionCode,
          subtotal,
          cart.getItems(),
          context
        );
        if (promotionDiscount.discount.isGreaterThan(Price.zero(context.currency))) {
          discounts = discounts.add(promotionDiscount.discount);
          appliedPromotions.push({
            code: promotionCode,
            type: promotionDiscount.type,
            discount: promotionDiscount.discount,
            description: promotionDiscount.description
          });
        }
      }
    }

    // Calculate tax
    const taxableAmount = subtotal.subtract(discounts);
    const tax = this.calculateTax(taxableAmount, context).amount;

    // Calculate shipping
    const shipping = this.calculateShipping(cart, taxableAmount, context).cost;

    // Calculate total
    const total = subtotal.subtract(discounts).add(tax).add(shipping);

    // Calculate savings
    const originalTotal = subtotal.add(tax).add(shipping);
    const savings = originalTotal.subtract(total);

    return {
      subtotal,
      discounts,
      tax,
      shipping,
      total,
      savings,
      appliedPromotions
    };
  }

  // Order pricing calculations
  calculateOrderPricing(order: Order, context: PricingContext): PriceBreakdown {
    let subtotal = Price.zero(context.currency);
    const appliedPromotions: PriceBreakdown['appliedPromotions'] = [];

    // Calculate subtotal from all items
    for (const item of order.getItems()) {
      subtotal = subtotal.add(item.getSubtotal());
    }

    // Get applied discounts
    const discounts = order.getDiscountAmount();
    
    // Add promotion details if available
    const promotions = order.getAppliedPromotions();
    for (const promotion of promotions) {
      appliedPromotions.push({
        code: promotion.code,
        type: promotion.type,
        discount: Price.create(promotion.discountAmount, context.currency),
        description: promotion.description
      });
    }

    const tax = order.getTaxAmount();
    const shipping = order.getShippingAmount();
    const total = order.getTotalAmount();
    const savings = discounts;

    return {
      subtotal,
      discounts,
      tax,
      shipping,
      total,
      savings,
      appliedPromotions
    };
  }

  // Cart item pricing
  private calculateCartItemPricing(item: CartItem, context: PricingContext): { unitPrice: Price; total: Price } {
    const unitPrice = item.getPrice();
    const total = unitPrice.multiply(item.getQuantity());
    return { unitPrice, total };
  }

  // Promotion discount calculation
  private calculatePromotionDiscount(
    promotionCode: string,
    subtotal: Price,
    items: CartItem[],
    context: PricingContext
  ): { discount: Price; type: string; description: string } {
    // This would typically fetch the promotion from repository
    // For now, return a placeholder implementation
    return {
      discount: Price.zero(context.currency),
      type: 'percentage',
      description: 'Promotion discount'
    };
  }

  // Tax calculation
  calculateTax(amount: Price, context: PricingContext): TaxCalculation {
    const rate = context.taxRate || this.getTaxRate(context.region || 'default');
    const taxAmount = amount.multiply(rate / 100);

    return {
      rate,
      amount: taxAmount,
      type: 'sales_tax',
      jurisdiction: context.region || 'default'
    };
  }

  // Shipping calculation
  calculateShipping(cart: Cart, subtotal: Price, context: PricingContext): ShippingCalculation {
    const method = context.shippingMethod || 'standard';
    let cost = this.getShippingCost(method, cart, context);
    
    // Check for free shipping threshold
    const freeShippingThreshold = this.getFreeShippingThreshold(context);
    if (freeShippingThreshold && subtotal.isGreaterThanOrEqual(freeShippingThreshold)) {
      cost = Price.zero(context.currency);
    }

    return {
      method,
      cost,
      estimatedDays: this.getEstimatedDeliveryDays(method),
      trackingAvailable: this.isTrackingAvailable(method),
      freeShippingThreshold,
      remainingForFreeShipping: freeShippingThreshold ? 
        freeShippingThreshold.subtract(subtotal) : undefined
    };
  }

  // Dynamic pricing based on demand, inventory, etc.
  calculateDynamicPrice(product: Product, context: PricingContext): Price {
    let basePrice = product.getPrice();
    
    // Apply demand-based pricing
    const demandMultiplier = this.getDemandMultiplier(product.getId());
    basePrice = basePrice.multiply(demandMultiplier);
    
    // Apply inventory-based pricing
    const inventoryMultiplier = this.getInventoryMultiplier(product.getId());
    basePrice = basePrice.multiply(inventoryMultiplier);
    
    // Apply time-based pricing (peak hours, seasons, etc.)
    const timeMultiplier = this.getTimeMultiplier(new Date());
    basePrice = basePrice.multiply(timeMultiplier);
    
    return basePrice;
  }

  // Bulk pricing calculation
  calculateBulkPrice(product: Product, quantity: number, context: PricingContext): Price {
    const basePrice = product.getPrice();
    const bulkTiers = this.getBulkPricingTiers(product.getId());
    
    for (const tier of bulkTiers.reverse()) {
      if (quantity >= tier.minQuantity) {
        return basePrice.multiply(1 - tier.discountPercentage / 100);
      }
    }
    
    return basePrice;
  }

  // Price comparison and optimization
  findBestPrice(product: Product, context: PricingContext): ProductPricing {
    const regularPrice = this.calculateProductPrice(product, context);
    const dynamicPrice = this.calculateDynamicPrice(product, context);
    const bulkPrice = this.calculateBulkPrice(product, 1, context);
    
    // Return the best price for the customer
    const prices = [regularPrice.finalPrice, dynamicPrice, bulkPrice];
    const bestPrice = prices.reduce((min, current) => 
      current.isLessThan(min) ? current : min
    );
    
    return {
      ...regularPrice,
      finalPrice: bestPrice
    };
  }

  // Price history and trends
  getPriceHistory(productId: string, days: number = 30): ProductPricing['priceHistory'] {
    // This would fetch from a price history repository
    return [];
  }

  // Competitor price comparison
  getCompetitorPrices(productId: string): ProductPricing['competitorPrices'] {
    // This would fetch from a competitor price tracking service
    return [];
  }

  // Helper methods
  private calculateDiscountPercentage(originalPrice: Price, discountedPrice: Price): number {
    const discount = originalPrice.subtract(discountedPrice);
    return (discount.getAmount() / originalPrice.getAmount()) * 100;
  }

  private calculateLoyaltyDiscount(price: Price, tier: string): Price {
    const discountPercentages: { [key: string]: number } = {
      'bronze': 5,
      'silver': 10,
      'gold': 15,
      'platinum': 20
    };
    
    const percentage = discountPercentages[tier] || 0;
    return price.multiply(percentage / 100);
  }

  private getTaxRate(region: string): number {
    const taxRates: { [key: string]: number } = {
      'default': 8.5,
      'CA': 10.25,
      'NY': 8.0,
      'TX': 6.25
    };
    
    return taxRates[region] || taxRates['default'];
  }

  private getShippingCost(method: string, cart: Cart, context: PricingContext): Price {
    const shippingRates: { [key: string]: number } = {
      'standard': 5.99,
      'express': 12.99,
      'overnight': 24.99,
      'pickup': 0
    };
    
    const baseCost = shippingRates[method] || shippingRates['standard'];
    return Price.create(baseCost, context.currency);
  }

  private getFreeShippingThreshold(context: PricingContext): Price | null {
    const threshold = 50; // $50 free shipping threshold
    return Price.create(threshold, context.currency);
  }

  private getEstimatedDeliveryDays(method: string): number {
    const deliveryDays: { [key: string]: number } = {
      'standard': 5,
      'express': 2,
      'overnight': 1,
      'pickup': 0
    };
    
    return deliveryDays[method] || deliveryDays['standard'];
  }

  private isTrackingAvailable(method: string): boolean {
    return method !== 'pickup';
  }

  private getDemandMultiplier(productId: string): number {
    // This would calculate based on recent sales, views, etc.
    return 1.0; // No adjustment for now
  }

  private getInventoryMultiplier(productId: string): number {
    // This would adjust price based on inventory levels
    return 1.0; // No adjustment for now
  }

  private getTimeMultiplier(date: Date): number {
    // This would adjust price based on time of day, season, etc.
    return 1.0; // No adjustment for now
  }

  private getBulkPricingTiers(productId: string): { minQuantity: number; discountPercentage: number }[] {
    // This would fetch bulk pricing tiers from configuration
    return [
      { minQuantity: 10, discountPercentage: 5 },
      { minQuantity: 50, discountPercentage: 10 },
      { minQuantity: 100, discountPercentage: 15 }
    ];
  }
}