import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

export interface CartSearchCriteria {
  userId?: string;
  storeId?: string;
  status?: string;
  hasItems?: boolean;
  minItemCount?: number;
  maxItemCount?: number;
  minTotal?: number;
  maxTotal?: number;
  currency?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  isAbandoned?: boolean;
  abandonedAfter?: Date;
}

export interface CartSortOptions {
  field: 'createdAt' | 'updatedAt' | 'totalAmount' | 'itemCount' | 'userId';
  direction: 'asc' | 'desc';
}

export interface CartPaginationOptions {
  page: number;
  limit: number;
  sort?: CartSortOptions;
}

export interface CartSearchResult {
  carts: Cart[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CartStatistics {
  totalCarts: number;
  activeCarts: number;
  abandonedCarts: number;
  averageCartValue: number;
  averageItemsPerCart: number;
  conversionRate: number;
  abandonmentRate: number;
  topProductsInCarts: { productId: string; productName: string; count: number }[];
}

export interface AbandonedCartInfo {
  cart: Cart;
  abandonedAt: Date;
  daysSinceAbandoned: number;
  estimatedValue: number;
  recoveryPotential: 'high' | 'medium' | 'low';
}

export interface CartRepository {
  // Basic CRUD operations
  save(cart: Cart): Promise<Cart>;
  findById(id: string): Promise<Cart | null>;
  findByUserId(userId: string): Promise<Cart | null>;
  findByUserAndStore(userId: string, storeId: string): Promise<Cart | null>;
  update(cart: Cart): Promise<Cart>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByUser(userId: string): Promise<boolean>;

  // Bulk operations
  saveMany(carts: Cart[]): Promise<Cart[]>;
  findByIds(ids: string[]): Promise<Cart[]>;
  findByUserIds(userIds: string[]): Promise<Cart[]>;
  updateMany(carts: Cart[]): Promise<Cart[]>;
  deleteMany(ids: string[]): Promise<void>;
  deleteByUserIds(userIds: string[]): Promise<void>;

  // Search and filtering
  search(criteria: CartSearchCriteria, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findAll(pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findActive(pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findByStore(storeId: string, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findByStatus(status: string, pagination?: CartPaginationOptions): Promise<CartSearchResult>;

  // Cart item management
  addItem(cartId: string, item: CartItem): Promise<void>;
  updateItem(cartId: string, itemId: string, updates: Partial<CartItem>): Promise<void>;
  removeItem(cartId: string, itemId: string): Promise<void>;
  clearItems(cartId: string): Promise<void>;
  findItemById(cartId: string, itemId: string): Promise<CartItem | null>;
  findItemByProduct(cartId: string, productId: string, variantId?: string): Promise<CartItem | null>;
  getItemCount(cartId: string): Promise<number>;
  hasItem(cartId: string, productId: string, variantId?: string): Promise<boolean>;

  // Cart calculations
  calculateSubtotal(cartId: string): Promise<number>;
  calculateTax(cartId: string): Promise<number>;
  calculateShipping(cartId: string): Promise<number>;
  calculateDiscount(cartId: string): Promise<number>;
  calculateTotal(cartId: string): Promise<number>;
  recalculateCart(cartId: string): Promise<Cart>;
  updateTotals(cartId: string): Promise<void>;

  // Cart status management
  activate(cartId: string): Promise<void>;
  deactivate(cartId: string): Promise<void>;
  abandon(cartId: string): Promise<void>;
  recover(cartId: string): Promise<void>;
  markAsConverted(cartId: string, orderId: string): Promise<void>;
  updateStatus(cartId: string, status: string): Promise<void>;

  // Abandoned cart management
  findAbandonedCarts(olderThanHours: number, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  getAbandonedCartInfo(cartId: string): Promise<AbandonedCartInfo | null>;
  findRecoverableCarts(pagination?: CartPaginationOptions): Promise<AbandonedCartInfo[]>;
  markAsRecovered(cartId: string): Promise<void>;
  getAbandonmentRate(days: number): Promise<number>;
  findCartsForRecoveryEmail(hours: number): Promise<Cart[]>;

  // Merge and transfer operations
  mergeCarts(sourceCartId: string, targetCartId: string): Promise<Cart>;
  transferCart(cartId: string, newUserId: string): Promise<void>;
  duplicateCart(cartId: string, newUserId?: string): Promise<Cart>;
  splitCartByStore(cartId: string): Promise<Cart[]>;

  // Validation and business rules
  validateCartForCheckout(cartId: string): Promise<{ valid: boolean; errors: string[] }>;
  checkItemAvailability(cartId: string): Promise<{ available: boolean; unavailableItems: string[] }>;
  validateQuantities(cartId: string): Promise<{ valid: boolean; invalidItems: string[] }>;
  canAddItem(cartId: string, productId: string, quantity: number): Promise<boolean>;
  getMaxQuantityForProduct(cartId: string, productId: string): Promise<number>;

  // Promotion and discount management
  applyPromotion(cartId: string, promotionCode: string): Promise<{ success: boolean; discount: number; message: string }>;
  removePromotion(cartId: string, promotionCode: string): Promise<void>;
  getAppliedPromotions(cartId: string): Promise<string[]>;
  calculatePromotionDiscount(cartId: string, promotionCode: string): Promise<number>;
  validatePromotions(cartId: string): Promise<void>;

  // Analytics and statistics
  getCartCount(): Promise<number>;
  getActiveCartCount(): Promise<number>;
  getAbandonedCartCount(): Promise<number>;
  getCartStatistics(days?: number): Promise<CartStatistics>;
  getAverageCartValue(days?: number): Promise<number>;
  getConversionRate(days?: number): Promise<number>;
  getTopProductsInCarts(limit: number): Promise<{ productId: string; count: number }[]>;
  getCartValueDistribution(): Promise<{ range: string; count: number }[]>;

  // Time-based queries
  findCreatedBetween(startDate: Date, endDate: Date, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findUpdatedBetween(startDate: Date, endDate: Date, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findModifiedSince(date: Date): Promise<Cart[]>;
  findStaleCart(olderThanDays: number): Promise<Cart[]>;

  // Currency and localization
  findByCurrency(currency: string, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  convertCartCurrency(cartId: string, newCurrency: string, exchangeRate: number): Promise<void>;
  updateCurrencyRates(cartId: string): Promise<void>;

  // Wishlist integration
  moveToWishlist(cartId: string, itemId: string, wishlistId: string): Promise<void>;
  moveFromWishlist(cartId: string, wishlistId: string, itemId: string): Promise<void>;
  saveForLater(cartId: string, itemId: string): Promise<void>;
  moveFromSavedItems(cartId: string, itemId: string): Promise<void>;

  // Guest cart management
  findBySessionId(sessionId: string): Promise<Cart | null>;
  associateWithUser(cartId: string, userId: string): Promise<void>;
  findGuestCarts(olderThanDays: number): Promise<Cart[]>;
  cleanupGuestCarts(olderThanDays: number): Promise<number>;

  // Inventory integration
  reserveInventory(cartId: string): Promise<{ success: boolean; reservedItems: string[]; failedItems: string[] }>;
  releaseInventory(cartId: string): Promise<void>;
  checkInventoryStatus(cartId: string): Promise<{ inStock: boolean; outOfStockItems: string[] }>;
  updateInventoryReservation(cartId: string, itemId: string, quantity: number): Promise<void>;

  // Performance and optimization
  preloadCartData(cartId: string): Promise<void>;
  warmupUserCart(userId: string): Promise<void>;
  optimizeCart(cartId: string): Promise<void>;
  cleanupEmptyCarts(olderThanDays: number): Promise<number>;

  // Cache management
  clearCache(cartId: string): Promise<void>;
  refreshCache(cartId: string): Promise<void>;
  clearUserCartCache(userId: string): Promise<void>;
  warmupCache(): Promise<void>;

  // Export and reporting
  exportCarts(criteria: CartSearchCriteria): Promise<any[]>;
  getCartReport(startDate: Date, endDate: Date): Promise<any>;
  getAbandonmentReport(days: number): Promise<any>;
  getConversionReport(days: number): Promise<any>;

  // Integration support
  findForSync(lastSyncDate: Date): Promise<Cart[]>;
  markAsSynced(cartIds: string[]): Promise<void>;
  syncCartData(cartId: string, externalData: any): Promise<void>;

  // Advanced search
  searchByProduct(productId: string, pagination?: CartPaginationOptions): Promise<CartSearchResult>;
  findSimilarCarts(cartId: string, limit: number): Promise<Cart[]>;
  findCartsWithCommonItems(cartId: string, minCommonItems: number): Promise<Cart[]>;

  // Notification and alerts
  findCartsForPriceDropAlert(): Promise<Cart[]>;
  findCartsForStockAlert(): Promise<Cart[]>;
  findCartsForPromotionAlert(promotionId: string): Promise<Cart[]>;
  markNotificationSent(cartId: string, notificationType: string): Promise<void>;

  // A/B testing support
  assignToExperiment(cartId: string, experimentId: string, variant: string): Promise<void>;
  findByExperiment(experimentId: string, variant?: string): Promise<Cart[]>;
  getExperimentResults(experimentId: string): Promise<any>;
}