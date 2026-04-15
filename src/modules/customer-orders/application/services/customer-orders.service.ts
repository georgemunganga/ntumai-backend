import { Injectable } from '@nestjs/common';
import { DeliveryService } from '../../../deliveries/application/services/delivery.service';
import { MatchingService } from '../../../matching/application/services/matching.service';
import { OrderService } from '../../../marketplace/orders/application/services/order.service';

type FeedType = 'all' | 'marketplace' | 'delivery' | 'task';
type FeedSection = 'all' | 'active' | 'history';

type FeedItem = {
  id: string;
  type: 'marketplace' | 'delivery' | 'task';
  title: string;
  subtitle: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
  primaryAction: string;
  detailRouteType: 'marketplace' | 'delivery' | 'task';
  detailId: string;
  trackingId?: string | null;
  vendorName?: string | null;
  taskerName?: string | null;
  itemCount?: number;
  addressSummary?: string | null;
  isTrackable: boolean;
  isCancelable: boolean;
  isRateable: boolean;
  sourceStatus?: string;
};

@Injectable()
export class CustomerOrdersService {
  constructor(
    private readonly orderService: OrderService,
    private readonly deliveryService: DeliveryService,
    private readonly matchingService: MatchingService,
  ) {}

  async listOrders(
    userId: string,
    options: {
      type?: FeedType;
      section?: FeedSection;
      page?: number;
      limit?: number;
    },
  ) {
    const type = options.type || 'all';
    const section = options.section || 'all';
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 20, 100));

    const [marketplaceResult, deliveryResult, taskResult] = await Promise.all([
      type === 'delivery' || type === 'task'
        ? Promise.resolve({ orders: [] as any[] })
        : this.orderService.getOrders(userId, 1, 200),
      type === 'marketplace' || type === 'task'
        ? Promise.resolve({ data: [] as any[] })
        : this.deliveryService.getMyDeliveries(userId, 'customer', 1, 200),
      type === 'marketplace' || type === 'delivery'
        ? Promise.resolve({ bookings: [] as any[] })
        : this.matchingService.listCustomerBookings(userId, undefined, 1, 200),
    ]);

    const rawDeliveries = Array.isArray(deliveryResult?.data)
      ? deliveryResult.data
      : [];

    const linkedOrderIds = new Set<string>();
    const deliveryByMarketplaceOrderId = new Map<string, any>();

    for (const delivery of rawDeliveries) {
      const metadata = this.parseDeliveryMetadata(delivery.more_info);
      const marketplaceOrderId = metadata?.marketplace_order_id;
      if (marketplaceOrderId) {
        linkedOrderIds.add(String(marketplaceOrderId));
        deliveryByMarketplaceOrderId.set(String(marketplaceOrderId), delivery);
      }
    }

    const marketplaceItems = (marketplaceResult.orders || []).map((order: any) =>
      this.toMarketplaceFeedItem(order, deliveryByMarketplaceOrderId.get(String(order.id))),
    );

    const deliveryItems = rawDeliveries
      .filter((delivery) => {
        const metadata = this.parseDeliveryMetadata(delivery.more_info);
        return !metadata?.marketplace_order_id;
      })
      .map((delivery) => this.toDeliveryFeedItem(delivery));

    const taskItems = (taskResult.bookings || []).map((booking: any) =>
      this.toTaskFeedItem(booking),
    );

    const allItems = [...marketplaceItems, ...deliveryItems, ...taskItems]
      .filter((item) => this.matchesSection(item, section))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    const total = allItems.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = allItems.slice(start, start + limit);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  }

  private toMarketplaceFeedItem(order: any, linkedDelivery?: any): FeedItem {
    const itemCount = Array.isArray(order.items)
      ? order.items.reduce(
          (sum: number, item: any) => sum + Number(item.quantity || 0),
          0,
        )
      : 0;
    const vendorName =
      order.items?.[0]?.storeName ||
      order.items?.[0]?.vendorName ||
      'Marketplace order';
    const addressSummary =
      order.address?.label ||
      order.address?.address ||
      order.address?.city ||
      null;
    const status = linkedDelivery
      ? this.normalizeDeliveryStatus(linkedDelivery.order_status)
      : this.normalizeMarketplaceStatus(order.status);

    return {
      id: String(order.id),
      type: 'marketplace',
      title: vendorName,
      subtitle: linkedDelivery
        ? 'Marketplace order in delivery'
        : `${itemCount} item${itemCount === 1 ? '' : 's'}`,
      status,
      statusLabel: this.toStatusLabel(status),
      createdAt: order.createdAt,
      updatedAt: linkedDelivery?.updated_at?.toISOString?.() || order.updatedAt,
      amount: Number(order.totalAmount || 0),
      currency: 'ZMW',
      primaryAction: 'Track order',
      detailRouteType: 'marketplace',
      detailId: String(order.id),
      trackingId: order.trackingId || null,
      vendorName,
      itemCount,
      addressSummary,
      isTrackable: true,
      isCancelable: !this.isHistoryStatus(status),
      isRateable: status === 'delivered' || status === 'completed',
      sourceStatus: order.status,
    };
  }

  private toDeliveryFeedItem(delivery: any): FeedItem {
    const stops = Array.isArray(delivery.stops) ? delivery.stops : [];
    const pickup = stops.find((stop: any) => stop.type === 'pickup');
    const dropoff = stops.find((stop: any) => stop.type !== 'pickup');
    const status = this.normalizeDeliveryStatus(delivery.order_status);
    return {
      id: String(delivery.id),
      type: 'delivery',
      title: 'Parcel delivery',
      subtitle: pickup?.address || delivery.vehicle_type || 'Customer delivery',
      status,
      statusLabel: this.toStatusLabel(status),
      createdAt: delivery.created_at.toISOString(),
      updatedAt: delivery.updated_at.toISOString(),
      amount: Number(delivery.payment?.amount || 0),
      currency: delivery.payment?.currency || 'ZMW',
      primaryAction: 'Track delivery',
      detailRouteType: 'delivery',
      detailId: String(delivery.id),
      trackingId: null,
      addressSummary: dropoff?.address || null,
      isTrackable: true,
      isCancelable: !this.isHistoryStatus(status),
      isRateable: status === 'delivered',
      sourceStatus: delivery.order_status,
    };
  }

  private toTaskFeedItem(booking: any): FeedItem {
    const pickupAddress = booking.pickup?.address || null;
    const dropoffAddress = Array.isArray(booking.dropoffs)
      ? booking.dropoffs.map((item: any) => item.address).filter(Boolean)[0] || null
      : null;
    const status = this.normalizeTaskStatus(booking.status);
    return {
      id: String(booking.booking_id),
      type: 'task',
      title: 'Task request',
      subtitle: pickupAddress || booking.vehicle_type || 'Customer task',
      status,
      statusLabel: this.toStatusLabel(status),
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      amount: 0,
      currency: 'ZMW',
      primaryAction: 'View task',
      detailRouteType: 'task',
      detailId: String(booking.booking_id),
      trackingId: booking.delivery_id || null,
      taskerName: booking.rider?.name || null,
      addressSummary: dropoffAddress,
      isTrackable: true,
      isCancelable: !this.isHistoryStatus(status),
      isRateable: status === 'completed',
      sourceStatus: booking.status,
    };
  }

  private parseDeliveryMetadata(value?: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private normalizeMarketplaceStatus(status?: string) {
    switch (String(status || '').toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'ACCEPTED':
        return 'accepted';
      case 'PREPARING':
        return 'preparing';
      case 'READY':
        return 'ready';
      case 'IN_TRANSIT':
      case 'DELIVERY':
        return 'in_transit';
      case 'DELIVERED':
        return 'delivered';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private normalizeDeliveryStatus(status?: string) {
    switch (String(status || '').toLowerCase()) {
      case 'booked':
        return 'pending';
      case 'delivery':
        return 'in_transit';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private normalizeTaskStatus(status?: string) {
    switch (String(status || '').toLowerCase()) {
      case 'searching':
      case 'offered':
        return 'pending';
      case 'accepted':
      case 'en_route':
      case 'arrived_pickup':
      case 'picked_up':
      case 'en_route_dropoff':
      case 'in_progress':
        return 'in_transit';
      case 'delivered':
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private toStatusLabel(status: string) {
    return status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private isHistoryStatus(status: string) {
    return ['delivered', 'completed', 'cancelled'].includes(status);
  }

  private matchesSection(item: FeedItem, section: FeedSection) {
    if (section === 'all') return true;
    if (section === 'history') return this.isHistoryStatus(item.status);
    return !this.isHistoryStatus(item.status);
  }
}
