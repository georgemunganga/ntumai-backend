import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsObject,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from './rider-profile.dto';

// Enums
export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum OrderType {
  FOOD_DELIVERY = 'FOOD_DELIVERY',
  GROCERY_DELIVERY = 'GROCERY_DELIVERY',
  PACKAGE_DELIVERY = 'PACKAGE_DELIVERY',
  PHARMACY_DELIVERY = 'PHARMACY_DELIVERY',
  DOCUMENT_DELIVERY = 'DOCUMENT_DELIVERY',
  FLOWER_DELIVERY = 'FLOWER_DELIVERY',
  OTHER = 'OTHER',
}

export enum OrderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PREPAID = 'PREPAID',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Customer Info DTO
export class CustomerInfoDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  @Length(1, 20)
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer profile picture URL' })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Customer rating' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Special instructions from customer' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  specialInstructions?: string;
}

// Vendor Info DTO
export class VendorInfoDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsString()
  vendorId: string;

  @ApiProperty({ description: 'Vendor name' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Vendor phone number' })
  @IsString()
  @Length(1, 20)
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Vendor email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Vendor address', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  address: LocationDto;

  @ApiPropertyOptional({ description: 'Vendor logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Vendor category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Preparation time in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;
}

// Order Item DTO
export class OrderItemDto {
  @ApiProperty({ description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Item quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Item unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total item price' })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Item image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Item category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Item weight in grams' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Special instructions for item' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Item customizations' })
  @IsOptional()
  @IsArray()
  customizations?: string[];
}

// Order Pricing DTO
export class OrderPricingDto {
  @ApiProperty({ description: 'Subtotal amount' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Delivery fee' })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Service fee' })
  @IsNumber()
  @Min(0)
  serviceFee: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({ description: 'Discount amount' })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({ description: 'Tip amount' })
  @IsNumber()
  @Min(0)
  tip: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiPropertyOptional({ description: 'Promo code applied' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'Surge multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  surgeMultiplier?: number;
}

// Order Timeline DTO
export class OrderTimelineDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Event timestamp' })
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event location', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Additional event data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

// Accept Order DTO
export class AcceptOrderDto {
  @ApiProperty({ description: 'Estimated pickup time' })
  @IsDateString()
  estimatedPickupTime: string;

  @ApiProperty({ description: 'Estimated delivery time' })
  @IsDateString()
  estimatedDeliveryTime: string;

  @ApiPropertyOptional({ description: 'Acceptance notes' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;
}

// Reject Order DTO
export class RejectOrderDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  @Length(1, 200)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional rejection notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}

// Update Order Status DTO
export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Current location', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  currentLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Status update notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery time' })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryTime?: string;

  @ApiPropertyOptional({ description: 'Photo evidence URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

// Pickup Order DTO
export class PickupOrderDto {
  @ApiProperty({ description: 'Pickup location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @ApiProperty({ description: 'Pickup time' })
  @IsDateString()
  pickupTime: string;

  @ApiPropertyOptional({ description: 'Pickup verification code' })
  @IsOptional()
  @IsString()
  @Length(4, 10)
  verificationCode?: string;

  @ApiPropertyOptional({ description: 'Pickup photo URL' })
  @IsOptional()
  @IsString()
  pickupPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Pickup notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}

// Deliver Order DTO
export class DeliverOrderDto {
  @ApiProperty({ description: 'Delivery location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryLocation: LocationDto;

  @ApiProperty({ description: 'Delivery time' })
  @IsDateString()
  deliveryTime: string;

  @ApiPropertyOptional({ description: 'Delivery verification code' })
  @IsOptional()
  @IsString()
  @Length(4, 10)
  verificationCode?: string;

  @ApiPropertyOptional({ description: 'Delivery photo URL' })
  @IsOptional()
  @IsString()
  deliveryPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Customer signature URL' })
  @IsOptional()
  @IsString()
  customerSignatureUrl?: string;

  @ApiPropertyOptional({ description: 'Delivery notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Cash collected amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashCollected?: number;
}

// Cancel Order DTO
export class CancelOrderDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @Length(1, 200)
  reason: string;

  @ApiPropertyOptional({ description: 'Cancellation notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Cancellation fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationFee?: number;
}

// Order Response DTO
export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Rider ID assigned to order' })
  riderId: string;

  @ApiProperty({ description: 'Shift ID when order was handled' })
  shiftId: string;

  @ApiProperty({ description: 'Original order ID from main system' })
  originalOrderId: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Order type', enum: OrderType })
  orderType: OrderType;

  @ApiProperty({ description: 'Order priority', enum: OrderPriority })
  priority: OrderPriority;

  @ApiProperty({ description: 'Customer information', type: CustomerInfoDto })
  customer: CustomerInfoDto;

  @ApiProperty({ description: 'Vendor information', type: VendorInfoDto })
  vendor: VendorInfoDto;

  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ description: 'Order pricing', type: OrderPricingDto })
  pricing: OrderPricingDto;

  @ApiProperty({ description: 'Pickup location', type: LocationDto })
  pickupLocation: LocationDto;

  @ApiProperty({ description: 'Delivery location', type: LocationDto })
  deliveryLocation: LocationDto;

  @ApiProperty({ description: 'Order creation time' })
  orderTime: string;

  @ApiPropertyOptional({ description: 'Order assignment time' })
  assignedAt?: string;

  @ApiPropertyOptional({ description: 'Order acceptance time' })
  acceptedAt?: string;

  @ApiPropertyOptional({ description: 'Order pickup time' })
  pickedUpAt?: string;

  @ApiPropertyOptional({ description: 'Order delivery time' })
  deliveredAt?: string;

  @ApiPropertyOptional({ description: 'Estimated pickup time' })
  estimatedPickupTime?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery time' })
  estimatedDeliveryTime?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Distance from pickup to delivery in kilometers' })
  distance: number;

  @ApiProperty({ description: 'Estimated duration in minutes' })
  estimatedDuration: number;

  @ApiProperty({ description: 'Actual duration in minutes' })
  actualDuration: number;

  @ApiProperty({ description: 'Rider earnings from this order' })
  riderEarnings: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Order timeline', type: [OrderTimelineDto] })
  timeline: OrderTimelineDto[];

  @ApiPropertyOptional({ description: 'Customer rating for this order' })
  customerRating?: number;

  @ApiPropertyOptional({ description: 'Customer feedback' })
  customerFeedback?: string;

  @ApiPropertyOptional({ description: 'Rider notes' })
  riderNotes?: string;

  @ApiPropertyOptional({ description: 'Special delivery instructions' })
  specialInstructions?: string;

  @ApiProperty({ description: 'Order creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last order update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

// Get Orders DTO
export class GetOrdersDto {
  @ApiPropertyOptional({ description: 'Filter by rider ID' })
  @IsOptional()
  @IsString()
  riderId?: string;

  @ApiPropertyOptional({ description: 'Filter by shift ID' })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by order type', enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: OrderPriority })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by vendor ID' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Filter by order date (from)' })
  @IsOptional()
  @IsDateString()
  orderDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by order date (to)' })
  @IsOptional()
  @IsDateString()
  orderDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum order value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum order value' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxOrderValue?: number;

  @ApiPropertyOptional({ description: 'Filter by payment method', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by payment status', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// Paginated Orders Response DTO
export class PaginatedOrdersResponseDto {
  @ApiProperty({ description: 'List of orders', type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty({ description: 'Total number of orders' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

// Find Nearby Orders DTO
export class FindNearbyOrdersDto {
  @ApiProperty({ description: 'Current rider location', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

  @ApiPropertyOptional({ description: 'Maximum number of orders to return', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by order type', enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: OrderPriority })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Minimum order value filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;
}

// Nearby Order DTO
export class NearbyOrderDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Order type', enum: OrderType })
  orderType: OrderType;

  @ApiProperty({ description: 'Order priority', enum: OrderPriority })
  priority: OrderPriority;

  @ApiProperty({ description: 'Pickup location', type: LocationDto })
  pickupLocation: LocationDto;

  @ApiProperty({ description: 'Delivery location', type: LocationDto })
  deliveryLocation: LocationDto;

  @ApiProperty({ description: 'Distance from rider to pickup in kilometers' })
  distanceToPickup: number;

  @ApiProperty({ description: 'Distance from pickup to delivery in kilometers' })
  deliveryDistance: number;

  @ApiProperty({ description: 'Estimated earnings for this order' })
  estimatedEarnings: number;

  @ApiProperty({ description: 'Order total value' })
  orderValue: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Estimated pickup time' })
  estimatedPickupTime: string;

  @ApiProperty({ description: 'Estimated delivery time' })
  estimatedDeliveryTime: string;

  @ApiProperty({ description: 'Vendor name' })
  vendorName: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  specialInstructions?: string;
}

// Order Summary DTO
export class OrderSummaryDto {
  @ApiProperty({ description: 'Summary period' })
  period: string;

  @ApiProperty({ description: 'Total orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Completed orders' })
  completedOrders: number;

  @ApiProperty({ description: 'Cancelled orders' })
  cancelledOrders: number;

  @ApiProperty({ description: 'Rejected orders' })
  rejectedOrders: number;

  @ApiProperty({ description: 'Total earnings from orders' })
  totalEarnings: number;

  @ApiProperty({ description: 'Average order value' })
  averageOrderValue: number;

  @ApiProperty({ description: 'Average delivery time in minutes' })
  averageDeliveryTime: number;

  @ApiProperty({ description: 'Completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average customer rating' })
  averageRating: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}