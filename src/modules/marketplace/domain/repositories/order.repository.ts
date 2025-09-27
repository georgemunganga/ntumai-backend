import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export interface OrderSearchCriteria {
  userId?: string;
  storeId?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  orderNumber?: string;
  minTotal?: number;
  maxTotal?: number;
  currency?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  deliveredAfter?: Date;
  deliveredBefore?: Date;
  hasPromotion?: boolean;
  promotionCode?: string;
  isGift?: boolean;
  hasNotes?: boolean;
}

export interface OrderSortOptions {
  field: 'orderNumber' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'status' | 'deliveryDate';
  direction: 'asc' | 'desc';
}

export interface OrderPaginationOptions {
  page: number;
  limit: number;
  sort?: OrderSortOptions;
}

export interface OrderSearchResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  repeatCustomerRate: number;
  topSellingProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  ordersByStatus: { [status: string]: number };
  ordersByPaymentMethod: { [method: string]: number };
  ordersByDeliveryMethod: { [method: string]: number };
}

export interface OrderTrend {
  date: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface OrderRepository {
  // Basic CRUD operations
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  update(order: Order): Promise<Order>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  existsByOrderNumber(orderNumber: string): Promise<boolean>;

  // Bulk operations
  saveMany(orders: Order[]): Promise<Order[]>;
  findByIds(ids: string[]): Promise<Order[]>;
  findByOrderNumbers(orderNumbers: string[]): Promise<Order[]>;
  updateMany(orders: Order[]): Promise<Order[]>;
  deleteMany(ids: string[]): Promise<void>;

  // Search and filtering
  search(criteria: OrderSearchCriteria, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findAll(pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByStatus(status: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByPaymentStatus(paymentStatus: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByDeliveryStatus(deliveryStatus: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByStore(storeId: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;

  // Order number generation and management
  generateOrderNumber(): Promise<string>;
  getNextOrderNumber(): Promise<string>;
  validateOrderNumber(orderNumber: string): Promise<boolean>;
  updateOrderNumber(orderId: string, orderNumber: string): Promise<void>;

  // Order status management
  updateStatus(orderId: string, status: string, notes?: string): Promise<void>;
  updatePaymentStatus(orderId: string, paymentStatus: string, transactionId?: string): Promise<void>;
  updateDeliveryStatus(orderId: string, deliveryStatus: string, trackingNumber?: string): Promise<void>;
  confirmOrder(orderId: string): Promise<void>;
  processOrder(orderId: string): Promise<void>;
  shipOrder(orderId: string, trackingNumber: string): Promise<void>;
  deliverOrder(orderId: string, deliveredAt?: Date): Promise<void>;
  cancelOrder(orderId: string, reason: string, refundAmount?: number): Promise<void>;
  refundOrder(orderId: string, amount: number, reason: string): Promise<void>;

  // Order item management
  addItem(orderId: string, item: OrderItem): Promise<void>;
  updateItem(orderId: string, itemId: string, updates: Partial<OrderItem>): Promise<void>;
  removeItem(orderId: string, itemId: string): Promise<void>;
  findItemById(orderId: string, itemId: string): Promise<OrderItem | null>;
  getItemCount(orderId: string): Promise<number>;
  getTotalQuantity(orderId: string): Promise<number>;

  // Order calculations
  calculateSubtotal(orderId: string): Promise<number>;
  calculateTax(orderId: string): Promise<number>;
  calculateShipping(orderId: string): Promise<number>;
  calculateDiscount(orderId: string): Promise<number>;
  calculateTotal(orderId: string): Promise<number>;
  recalculateOrder(orderId: string): Promise<Order>;
  updateTotals(orderId: string): Promise<void>;

  // Payment management
  recordPayment(orderId: string, amount: number, method: string, transactionId: string): Promise<void>;
  recordRefund(orderId: string, amount: number, reason: string, transactionId?: string): Promise<void>;
  getPaymentHistory(orderId: string): Promise<any[]>;
  getTotalPaid(orderId: string): Promise<number>;
  getTotalRefunded(orderId: string): Promise<number>;
  getOutstandingAmount(orderId: string): Promise<number>;

  // Delivery and shipping
  updateDeliveryAddress(orderId: string, address: any): Promise<void>;
  updateDeliveryMethod(orderId: string, method: string, fee: number): Promise<void>;
  updateTrackingNumber(orderId: string, trackingNumber: string): Promise<void>;
  updateEstimatedDelivery(orderId: string, estimatedDate: Date): Promise<void>;
  updateActualDelivery(orderId: string, actualDate: Date): Promise<void>;
  getDeliveryHistory(orderId: string): Promise<any[]>;

  // Promotion and discount management
  applyPromotion(orderId: string, promotionCode: string, discountAmount: number): Promise<void>;
  removePromotion(orderId: string, promotionCode: string): Promise<void>;
  getAppliedPromotions(orderId: string): Promise<string[]>;
  getTotalDiscount(orderId: string): Promise<number>;

  // Gift and special orders
  markAsGift(orderId: string, giftMessage: string, recipientInfo: any): Promise<void>;
  updateGiftMessage(orderId: string, giftMessage: string): Promise<void>;
  findGiftOrders(pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  scheduleDelivery(orderId: string, scheduledDate: Date): Promise<void>;

  // Analytics and statistics
  getOrderCount(criteria?: OrderSearchCriteria): Promise<number>;
  getOrderStatistics(startDate?: Date, endDate?: Date): Promise<OrderStatistics>;
  getRevenue(startDate?: Date, endDate?: Date): Promise<number>;
  getAverageOrderValue(startDate?: Date, endDate?: Date): Promise<number>;
  getOrderTrends(days: number): Promise<OrderTrend[]>;
  getTopCustomers(limit: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getTopProducts(limit: number, startDate?: Date, endDate?: Date): Promise<any[]>;
  getConversionRate(startDate?: Date, endDate?: Date): Promise<number>;

  // Time-based queries
  findCreatedBetween(startDate: Date, endDate: Date, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findDeliveredBetween(startDate: Date, endDate: Date, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findModifiedSince(date: Date): Promise<Order[]>;
  findPendingOrders(olderThanHours?: number): Promise<Order[]>;
  findOverdueOrders(): Promise<Order[]>;
  findRecentOrders(hours: number): Promise<Order[]>;

  // Customer relationship
  findByCustomer(userId: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  getCustomerOrderHistory(userId: string): Promise<Order[]>;
  getCustomerLifetimeValue(userId: string): Promise<number>;
  getCustomerOrderCount(userId: string): Promise<number>;
  findRepeatCustomers(minOrders: number): Promise<any[]>;
  getCustomerAverageOrderValue(userId: string): Promise<number>;

  // Inventory integration
  reserveInventory(orderId: string): Promise<{ success: boolean; reservedItems: string[]; failedItems: string[] }>;
  releaseInventory(orderId: string): Promise<void>;
  updateInventoryOnDelivery(orderId: string): Promise<void>;
  checkInventoryAvailability(orderId: string): Promise<{ available: boolean; unavailableItems: string[] }>;

  // Returns and exchanges
  initiateReturn(orderId: string, itemIds: string[], reason: string): Promise<string>;
  processReturn(orderId: string, returnId: string, status: string): Promise<void>;
  initiateExchange(orderId: string, itemId: string, newProductId: string): Promise<string>;
  getReturnHistory(orderId: string): Promise<any[]>;
  findOrdersEligibleForReturn(): Promise<Order[]>;

  // Fraud detection and security
  flagAsSuspicious(orderId: string, reason: string): Promise<void>;
  clearSuspiciousFlag(orderId: string): Promise<void>;
  findSuspiciousOrders(): Promise<Order[]>;
  validateOrderSecurity(orderId: string): Promise<{ valid: boolean; issues: string[] }>;

  // Notification and communication
  markNotificationSent(orderId: string, notificationType: string): Promise<void>;
  getNotificationHistory(orderId: string): Promise<any[]>;
  findOrdersForStatusNotification(status: string): Promise<Order[]>;
  findOrdersForDeliveryReminder(): Promise<Order[]>;

  // Reporting and export
  exportOrders(criteria: OrderSearchCriteria): Promise<any[]>;
  getSalesReport(startDate: Date, endDate: Date): Promise<any>;
  getCustomerReport(startDate: Date, endDate: Date): Promise<any>;
  getProductPerformanceReport(startDate: Date, endDate: Date): Promise<any>;
  getDeliveryPerformanceReport(startDate: Date, endDate: Date): Promise<any>;

  // Cache management
  clearCache(orderId: string): Promise<void>;
  refreshCache(orderId: string): Promise<void>;
  clearUserOrderCache(userId: string): Promise<void>;
  warmupCache(): Promise<void>;

  // Integration support
  findForSync(lastSyncDate: Date): Promise<Order[]>;
  markAsSynced(orderIds: string[]): Promise<void>;
  syncOrderData(orderId: string, externalData: any): Promise<void>;
  exportForAccounting(startDate: Date, endDate: Date): Promise<any[]>;

  // Advanced search and filtering
  searchByProduct(productId: string, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByPriceRange(minPrice: number, maxPrice: number, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findByDeliveryDateRange(startDate: Date, endDate: Date, pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  findSimilarOrders(orderId: string, limit: number): Promise<Order[]>;

  // Performance optimization
  preloadOrderData(orderId: string): Promise<void>;
  optimizeOrder(orderId: string): Promise<void>;
  archiveOldOrders(olderThanDays: number): Promise<number>;
  cleanupCancelledOrders(olderThanDays: number): Promise<number>;

  // Audit and compliance
  getOrderAuditLog(orderId: string): Promise<any[]>;
  recordAuditEvent(orderId: string, event: string, details: any): Promise<void>;
  findOrdersForCompliance(criteria: any): Promise<Order[]>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<any>;

  // Multi-store support
  findByStores(storeIds: string[], pagination?: OrderPaginationOptions): Promise<OrderSearchResult>;
  getStoreOrderStatistics(storeId: string, startDate?: Date, endDate?: Date): Promise<OrderStatistics>;
  transferOrderToStore(orderId: string, newStoreId: string): Promise<void>;
  splitOrderByStore(orderId: string): Promise<Order[]>;
}