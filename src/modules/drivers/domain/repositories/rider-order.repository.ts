import { RiderOrder } from '../entities/rider-order.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export interface OrderSearchFilters {
  riderId?: string;
  orderId?: string;
  customerId?: string;
  vendorId?: string;
  status?: string[];
  type?: string[];
  paymentMethod?: string[];
  paymentStatus?: string[];
  createdDate?: {
    after?: Date;
    before?: Date;
  };
  scheduledDate?: {
    after?: Date;
    before?: Date;
  };
  completedDate?: {
    after?: Date;
    before?: Date;
  };
  totalAmount?: {
    min?: number;
    max?: number;
  };
  deliveryFee?: {
    min?: number;
    max?: number;
  };
  tip?: {
    min?: number;
    max?: number;
  };
  distance?: {
    min?: number;
    max?: number;
  };
  deliveryTime?: {
    min?: number; // in minutes
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  isOnTime?: boolean;
  hasIssues?: boolean;
  pickupLocation?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  tags?: string[];
}

export interface OrderSortOptions {
  field: 'createdAt' | 'scheduledAt' | 'completedAt' | 'totalAmount' | 'deliveryFee' | 'tip' | 'distance' | 'deliveryTime' | 'rating';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  averageDeliveryTime: number;
  averageRating: number;
  averageEarnings: number;
  totalEarnings: number;
  totalDistance: number;
  onTimeDeliveryRate: number;
  completionRate: number;
  cancellationRate: number;
}

export interface OrderPerformanceMetrics {
  riderId: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  completionRate: number;
  cancellationRate: number;
  averageDeliveryTime: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  totalEarnings: number;
  averageEarningsPerOrder: number;
  totalDistance: number;
  averageDistancePerOrder: number;
  averageEarningsPerKm: number;
  peakHours: string[];
  preferredAreas: string[];
  customerSatisfactionScore: number;
}

export interface OrderHeatmapData {
  location: Location;
  orderCount: number;
  totalEarnings: number;
  averageRating: number;
  averageDeliveryTime: number;
}

export interface OrderTrend {
  period: string;
  orderCount: number;
  completionRate: number;
  averageEarnings: number;
  averageRating: number;
  onTimeRate: number;
}

export interface RiderOrderRepository {
  // Basic CRUD operations
  save(order: RiderOrder): Promise<void>;
  findById(id: UniqueEntityID): Promise<RiderOrder | null>;
  findByOrderId(orderId: string): Promise<RiderOrder | null>;
  findByRiderId(
    riderId: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: OrderSearchFilters,
    sort?: OrderSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByIds(ids: UniqueEntityID[]): Promise<RiderOrder[]>;

  // Status-based queries
  findByStatus(
    status: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findActiveOrders(
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  findCurrentOrder(riderId: UniqueEntityID): Promise<RiderOrder | null>;
  
  findPendingOrders(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findInProgressOrders(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findCompletedOrders(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findCancelledOrders(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findFailedOrders(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  // Time-based queries
  findByDateRange(
    startDate: Date,
    endDate: Date,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByDay(
    date: Date,
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  findByWeek(
    weekStart: Date,
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  findByMonth(
    year: number,
    month: number,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findTodaysOrders(
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  findThisWeeksOrders(
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  findThisMonthsOrders(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  // Scheduled orders
  findScheduledOrders(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findUpcomingOrders(
    riderId?: UniqueEntityID,
    hoursAhead?: number
  ): Promise<RiderOrder[]>;

  findOverdueOrders(
    riderId?: UniqueEntityID
  ): Promise<RiderOrder[]>;

  // Location-based queries
  findByPickupLocation(
    location: Location,
    radius: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findByDeliveryLocation(
    location: Location,
    radius: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findInArea(
    bounds: {
      northEast: Location;
      southWest: Location;
    },
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findNearbyOrders(
    riderLocation: Location,
    radius: number,
    status?: string[]
  ): Promise<RiderOrder[]>;

  // Performance-based queries
  findHighValueOrders(
    minAmount: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByEarningsRange(
    minEarnings: number,
    maxEarnings: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByRatingRange(
    minRating: number,
    maxRating: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findLongDistanceOrders(
    minDistance: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findQuickDeliveries(
    maxMinutes: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findDelayedOrders(
    minDelayMinutes: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  // Customer and vendor queries
  findByCustomerId(
    customerId: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByVendorId(
    vendorId: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  // Payment-related queries
  findByPaymentMethod(
    paymentMethod: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findByPaymentStatus(
    paymentStatus: string,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findUnpaidOrders(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  findOrdersWithTips(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<RiderOrder>>;

  // Issue and quality queries
  findOrdersWithIssues(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findLowRatedOrders(
    maxRating: number,
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  findOrdersWithComplaints(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<RiderOrder[]>;

  // Analytics and reporting
  getOrderAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<OrderAnalytics>;

  getRiderPerformanceMetrics(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<OrderPerformanceMetrics>;

  getHourlyBreakdown(
    riderId?: UniqueEntityID,
    date?: Date
  ): Promise<Array<{
    hour: number;
    orderCount: number;
    completedOrders: number;
    totalEarnings: number;
    averageRating: number;
  }>>;

  getDailyBreakdown(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    date: string;
    orderCount: number;
    completedOrders: number;
    totalEarnings: number;
    averageRating: number;
    onTimeRate: number;
  }>>;

  getWeeklyBreakdown(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    week: string;
    orderCount: number;
    completedOrders: number;
    totalEarnings: number;
    averageRating: number;
    onTimeRate: number;
  }>>;

  getMonthlyBreakdown(
    riderId?: UniqueEntityID,
    year?: number
  ): Promise<Array<{
    month: string;
    orderCount: number;
    completedOrders: number;
    totalEarnings: number;
    averageRating: number;
    onTimeRate: number;
  }>>;

  // Heatmap and geographical analysis
  getOrderHeatmapData(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    gridSize?: number
  ): Promise<OrderHeatmapData[]>;

  getPopularPickupLocations(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    limit?: number
  ): Promise<Array<{
    location: Location;
    address: string;
    orderCount: number;
    totalEarnings: number;
  }>>;

  getPopularDeliveryAreas(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    limit?: number
  ): Promise<Array<{
    area: string;
    orderCount: number;
    totalEarnings: number;
    averageDistance: number;
  }>>;

  // Trends and patterns
  getOrderTrends(
    riderId?: UniqueEntityID,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    timeframe?: { start: Date; end: Date }
  ): Promise<OrderTrend[]>;

  getPeakHours(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    hour: number;
    orderCount: number;
    averageEarnings: number;
    completionRate: number;
  }>>;

  getBusiestDays(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    dayOfWeek: string;
    orderCount: number;
    averageEarnings: number;
    completionRate: number;
  }>>;

  // Optimization and recommendations
  findOptimalOrders(
    riderId: UniqueEntityID,
    currentLocation: Location,
    preferences?: {
      maxDistance?: number;
      minEarnings?: number;
      preferredAreas?: string[];
      vehicleType?: string;
    }
  ): Promise<RiderOrder[]>;

  getRecommendedOrders(
    riderId: UniqueEntityID,
    limit?: number
  ): Promise<Array<{
    order: RiderOrder;
    score: number;
    reasons: string[];
  }>>;

  // Bulk operations
  saveMany(orders: RiderOrder[]): Promise<void>;
  updateMany(
    filters: OrderSearchFilters,
    updates: Partial<{
      status: string;
      paymentStatus: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: OrderSearchFilters): Promise<number>;

  // Advanced queries
  findSimilarOrders(
    orderId: UniqueEntityID,
    criteria: ('location' | 'amount' | 'distance' | 'time' | 'customer')[]
  ): Promise<RiderOrder[]>;

  findOrdersByPattern(
    riderId: UniqueEntityID,
    pattern: {
      timeOfDay?: string;
      dayOfWeek?: string;
      location?: Location;
      orderType?: string;
    }
  ): Promise<RiderOrder[]>;

  // Real-time queries
  findAvailableOrdersForRider(
    riderId: UniqueEntityID,
    currentLocation: Location,
    maxDistance?: number
  ): Promise<RiderOrder[]>;

  findOrdersNeedingReassignment(): Promise<RiderOrder[]>;

  // Cache management
  invalidateCache(orderId?: UniqueEntityID): Promise<void>;
  warmupCache(orderIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(order: RiderOrder, expectedVersion: number): Promise<void>;
}