import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from './order-search.dto';
import { PaymentMethod, ShippingAddressDto, BillingAddressDto } from './create-order.dto';

export class OrderItemProductDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product slug' })
  slug: string;

  @ApiProperty({ description: 'Product SKU' })
  sku: string;

  @ApiProperty({ description: 'Primary product image' })
  primaryImage: string;

  @ApiProperty({ description: 'Store name' })
  storeName: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  brandName?: string;
}

export class OrderItemVariantDto {
  @ApiProperty({ description: 'Variant ID' })
  id: string;

  @ApiProperty({ description: 'Variant name' })
  name: string;

  @ApiProperty({ description: 'Variant value' })
  value: string;
}

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Product information' })
  product: OrderItemProductDto;

  @ApiPropertyOptional({ description: 'Selected variant information' })
  variant?: OrderItemVariantDto;

  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ description: 'Unit price at time of order' })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item' })
  totalPrice: number;

  @ApiPropertyOptional({ description: 'Additional options or customizations' })
  options?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Special notes or instructions' })
  notes?: string;
}

export class OrderCustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  id: string;

  @ApiProperty({ description: 'Customer full name' })
  fullName: string;

  @ApiProperty({ description: 'Customer email' })
  email: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  phone?: string;
}

export class OrderPaymentDto {
  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payment gateway transaction ID' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Payment date' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Payment failure reason' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Refund amount' })
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Refund date' })
  refundedAt?: Date;
}

export class OrderSummaryDto {
  @ApiProperty({ description: 'Subtotal (sum of all item prices)' })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping cost' })
  shippingCost: number;

  @ApiProperty({ description: 'Tip amount' })
  tipAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Total items count' })
  itemCount: number;

  @ApiProperty({ description: 'Total quantity of all items' })
  totalQuantity: number;
}

export class OrderTrackingDto {
  @ApiProperty({ description: 'Tracking number' })
  trackingNumber: string;

  @ApiProperty({ description: 'Carrier name' })
  carrier: string;

  @ApiPropertyOptional({ description: 'Tracking URL' })
  trackingUrl?: string;

  @ApiPropertyOptional({ description: 'Shipped date' })
  shippedAt?: Date;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  estimatedDeliveryAt?: Date;

  @ApiPropertyOptional({ description: 'Actual delivery date' })
  deliveredAt?: Date;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Customer information' })
  customer: OrderCustomerDto;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Order summary' })
  summary: OrderSummaryDto;

  @ApiProperty({ description: 'Shipping address' })
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ description: 'Billing address' })
  billingAddress: BillingAddressDto;

  @ApiProperty({ description: 'Payment information' })
  payment: OrderPaymentDto;

  @ApiPropertyOptional({ description: 'Tracking information' })
  tracking?: OrderTrackingDto;

  @ApiPropertyOptional({ description: 'Applied promotion code' })
  promotionCode?: string;

  @ApiPropertyOptional({ description: 'Applied gift card code' })
  giftCardCode?: string;

  @ApiPropertyOptional({ description: 'Special order notes' })
  notes?: string;

  @ApiProperty({ description: 'Order creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Order confirmation date' })
  confirmedAt?: Date;

  @ApiPropertyOptional({ description: 'Order cancellation date' })
  cancelledAt?: Date;
}

export class OrderListResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  customerEmail: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Items count' })
  itemCount: number;

  @ApiProperty({ description: 'Order creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class OrderSearchResponseDto {
  @ApiProperty({ description: 'List of orders', type: [OrderListResponseDto] })
  orders: OrderListResponseDto[];

  @ApiProperty({ description: 'Total number of orders found' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class OrderStatsResponseDto {
  @ApiProperty({ description: 'Total orders count' })
  totalOrders: number;

  @ApiProperty({ description: 'Pending orders count' })
  pendingOrders: number;

  @ApiProperty({ description: 'Confirmed orders count' })
  confirmedOrders: number;

  @ApiProperty({ description: 'Shipped orders count' })
  shippedOrders: number;

  @ApiProperty({ description: 'Delivered orders count' })
  deliveredOrders: number;

  @ApiProperty({ description: 'Cancelled orders count' })
  cancelledOrders: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average order value' })
  averageOrderValue: number;

  @ApiProperty({ description: 'Total items sold' })
  totalItemsSold: number;
}