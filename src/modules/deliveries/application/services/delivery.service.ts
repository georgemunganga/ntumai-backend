import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { DELIVERY_REPOSITORY } from '../../domain/repositories/delivery.repository.interface';
import type { IDeliveryRepository } from '../../domain/repositories/delivery.repository.interface';
import {
  DeliveryOrder,
  VehicleType,
} from '../../domain/entities/delivery-order.entity';
import { Stop, StopType } from '../../domain/entities/stop.entity';
import {
  CreateDeliveryDto,
  AttachPricingDto,
  SetPaymentMethodDto,
  EstimateDeliveryPricingDto,
} from '../dtos/create-delivery.dto';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { NotificationsService } from '../../../notifications/application/services/notifications.service';
// import { PricingCalculatorService } from '../../../pricing/application/services/pricing-calculator.service'; // Removed due to missing PricingModule

@Injectable()
export class DeliveryService {
  private readonly pricingSecret =
    process.env.DELIVERY_PRICING_SECRET ||
    process.env.APP_KEY ||
    'ntumai-delivery-pricing-secret';

  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    // @Inject(PricingCalculatorService)
    // private readonly pricingService: PricingCalculatorService, // Removed due to missing PricingModule
  ) {}

  /**
   * Create a new delivery (works independently or with marketplace)
   */
  async createDelivery(
    dto: CreateDeliveryDto,
    userId: string,
    userRole: string,
  ): Promise<DeliveryOrder> {
    // Validate stops
    this.validateStops(dto.stops);

    // Validate scheduling
    if (dto.is_scheduled) {
      this.validateScheduling(dto.scheduled_at);
    }

    // Create delivery order
    const deliveryId = `del_${nanoid(10)}`;
    const delivery = DeliveryOrder.create({
      id: deliveryId,
      created_by_user_id: userId,
      placed_by_role: userRole,
      vehicle_type: dto.vehicle_type as VehicleType,
      courier_comment: dto.courier_comment,
      is_scheduled: dto.is_scheduled || false,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
      more_info: dto.more_info,
    });

    // Add stops
    for (const stopDto of dto.stops) {
      const stop = Stop.create({
        id: `stp_${nanoid(8)}`,
        type: stopDto.type as StopType,
        sequence: stopDto.sequence,
        contact_name: stopDto.contact_name,
        contact_phone: stopDto.contact_phone,
        notes: stopDto.notes,
        geo: stopDto.geo,
        address: stopDto.address,
      });
      delivery.addStop(stop);
    }

    // Store optional marketplace references in more_info as JSON
    if (dto.marketplace_order_id || dto.store_id) {
      const metadata = {
        marketplace_order_id: dto.marketplace_order_id,
        store_id: dto.store_id,
        source: 'marketplace',
      };
      delivery.more_info = JSON.stringify(metadata);
    }

    return this.deliveryRepository.create(delivery);
  }

  /**
   * Attach pricing from calculator (verifies signature)
   */
  async attachPricing(
    deliveryId: string,
    dto: AttachPricingDto,
    userId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Verify ownership
    if (delivery.created_by_user_id !== userId) {
      throw new ForbiddenException('Not authorized to modify this delivery');
    }

    const verification = this.verifyPricingSignature(
      dto.calc_payload,
      dto.calc_sig,
    );

    if (!verification.valid) {
      throw new BadRequestException('Invalid pricing signature');
    }

    if (verification.expired) {
      throw new BadRequestException('Pricing has expired, please recalculate');
    }

    // Attach pricing
    delivery.attachPricing(
      dto.calc_payload,
      dto.calc_sig,
      dto.calc_payload.currency,
      dto.calc_payload.total,
      new Date(dto.calc_payload.expires_at),
    );

    return this.deliveryRepository.update(deliveryId, delivery);
  }

  estimatePricing(dto: EstimateDeliveryPricingDto): any {
    if (!Array.isArray(dto.points) || dto.points.length < 2) {
      throw new BadRequestException(
        'At least pickup and dropoff points are required',
      );
    }

    const pricingConfig = this.getPricingConfig();
    const vehicleConfig = pricingConfig.vehicles[dto.vehicle_type];
    if (!vehicleConfig) {
      throw new BadRequestException('Unsupported vehicle type');
    }

    const distanceKm = Number(
      this.calculateRouteDistanceKm(dto.points).toFixed(2),
    );
    const routeBase = vehicleConfig.base_fare + distanceKm * vehicleConfig.per_km;
    const routeCharge = Math.max(vehicleConfig.minimum_fare, routeBase);
    const sizeSurcharge = pricingConfig.size_surcharges[dto.parcel_size || 'medium'];
    const fragileSurcharge = dto.fragile ? pricingConfig.fragile_surcharge : 0;
    const extraStopCount = Math.max(0, dto.points.length - 2);
    const extraStopSurcharge = extraStopCount * pricingConfig.extra_stop_fee;
    const total = Number(
      (routeCharge + sizeSurcharge + fragileSurcharge + extraStopSurcharge).toFixed(2),
    );
    const estimatedDurationMinutes = Math.max(
      10,
      Math.round(distanceKm * vehicleConfig.minutes_per_km),
    );
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const calcPayload = {
      currency: 'ZMW',
      total,
      expires_at: expiresAt,
      vehicle_type: dto.vehicle_type,
      distance_km: distanceKm,
      estimated_duration_minutes: estimatedDurationMinutes,
      parcel_size: dto.parcel_size || 'medium',
      fragile: Boolean(dto.fragile),
      breakdown: {
        base_fare: vehicleConfig.base_fare,
        distance_charge: Number((routeCharge - vehicleConfig.base_fare).toFixed(2)),
        minimum_fare_applied: routeCharge === vehicleConfig.minimum_fare,
        route_charge: Number(routeCharge.toFixed(2)),
        size_surcharge: sizeSurcharge,
        fragile_surcharge: fragileSurcharge,
        extra_stop_surcharge: extraStopSurcharge,
      },
    };

    return {
      currency: 'ZMW',
      distance_km: distanceKm,
      estimated_duration_minutes: estimatedDurationMinutes,
      pricing_rules: pricingConfig,
      calc_payload: calcPayload,
      calc_sig: this.signPricingPayload(calcPayload),
    };
  }

  /**
   * Set payment method
   */
  async setPaymentMethod(
    deliveryId: string,
    dto: SetPaymentMethodDto,
    userId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.created_by_user_id !== userId) {
      throw new ForbiddenException('Not authorized to modify this delivery');
    }

    delivery.setPaymentMethod(dto.method);
    return this.deliveryRepository.update(deliveryId, delivery);
  }

  /**
   * Preflight check before submit
   */
  async preflight(
    deliveryId: string,
    userId: string,
  ): Promise<{ ready: boolean; ready_token: string; expires_at: string }> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.created_by_user_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Check if pricing is attached and valid
    if (!delivery.payment.calc_sig) {
      throw new BadRequestException('Pricing not attached');
    }

    if (!delivery.isPricingValid()) {
      throw new BadRequestException('Pricing has expired');
    }

    // Check if payment method is set
    if (!delivery.payment.method) {
      throw new BadRequestException('Payment method not set');
    }

    // Generate ready token
    const readyToken = `rdy_${nanoid(32)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    delivery.setReadyToken(readyToken, expiresAt);
    await this.deliveryRepository.update(deliveryId, delivery);

    return {
      ready: true,
      ready_token: readyToken,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Submit delivery (final step)
   */
  async submitDelivery(
    deliveryId: string,
    readyToken: string,
    userId: string,
    idempotencyKey?: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.created_by_user_id !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    // Verify ready token
    if (delivery.ready_token !== readyToken) {
      throw new BadRequestException('Invalid ready token');
    }

    if (!delivery.isReadyTokenValid()) {
      throw new BadRequestException('Ready token has expired');
    }

    if (!delivery.canSubmit()) {
      throw new BadRequestException('Delivery is not ready to submit');
    }

    // Here you would typically:
    // 1. Process payment (if not COD)
    // 2. Notify riders/dispatch system
    // 3. Create tracking records
    // 4. Send notifications

    // For now, just mark as submitted
    delivery.updated_at = new Date();
    const updated = await this.deliveryRepository.update(deliveryId, delivery);

    await this.notificationsService.createNotification({
      userId,
      title: 'Delivery submitted',
      message: `Your delivery ${deliveryId} has been submitted successfully.`,
      type: 'DELIVERY_UPDATE',
      metadata: {
        entityType: 'delivery',
        entityId: deliveryId,
        sourceStatus: 'booked',
        statusLabel: 'Booked',
      },
    });

    return updated;
  }

  /**
   * Get deliveries for a user (customer/vendor view)
   */
  async getMyDeliveries(
    userId: string,
    role: string,
    page: number = 1,
    size: number = 20,
  ): Promise<any> {
    const result = await this.deliveryRepository.findAll(
      { created_by_user_id: userId, placed_by_role: role },
      { page, size },
    );

    const deliveries = Array.isArray(result?.data) ? result.data : [];
    for (const delivery of deliveries) {
      (delivery as any).conversationId = await this.findConversationId(delivery.id);
    }

    return result;
  }

  async getMyDeliveryOrThrow(
    deliveryId: string,
    userId: string,
    role: string,
  ): Promise<any> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (
      String(delivery.created_by_user_id) !== String(userId) ||
      String(delivery.placed_by_role || '').toLowerCase() !==
        String(role || '').toLowerCase()
    ) {
      throw new NotFoundException('Delivery not found');
    }

    return {
      ...delivery,
      conversationId: await this.findConversationId(delivery.id),
    };
  }

  /**
   * Get nearby deliveries for riders
   */
  async getNearbyDeliveries(
    lat: number,
    lng: number,
    radius_km: number,
    vehicle_type?: string,
  ): Promise<DeliveryOrder[]> {
    return this.deliveryRepository.findNearby(
      lat,
      lng,
      radius_km,
      vehicle_type,
    );
  }

  /**
   * Rider accepts delivery
   */
  async acceptDelivery(
    deliveryId: string,
    riderId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.rider_id) {
      throw new BadRequestException(
        'Delivery already accepted by another rider',
      );
    }

    delivery.assignRider(riderId);
    const updated = await this.deliveryRepository.update(deliveryId, delivery);

    await Promise.all([
      this.notificationsService.createNotification({
        userId: delivery.created_by_user_id,
        title: 'Rider assigned',
        message: `A rider has accepted delivery ${deliveryId}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Rider Assigned',
        },
      }),
      this.notificationsService.createNotification({
        userId: riderId,
        title: 'Delivery accepted',
        message: `You are now assigned to delivery ${deliveryId}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Delivery Accepted',
        },
      }),
    ]);

    return updated;
  }

  /**
   * Mark delivery as in delivery
   */
  async markAsDelivery(
    deliveryId: string,
    riderId: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.rider_id !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }

    delivery.markAsDelivery();
    const updated = await this.deliveryRepository.update(deliveryId, delivery);

    await this.notificationsService.createNotification({
      userId: delivery.created_by_user_id,
      title: 'Delivery in transit',
      message: `Delivery ${deliveryId} is now on the way.`,
      type: 'DELIVERY_UPDATE',
      metadata: {
        entityType: 'delivery',
        entityId: deliveryId,
        sourceStatus: 'delivery',
        statusLabel: 'In Transit',
      },
    });

    return updated;
  }

  async rateCustomer(
    deliveryId: string,
    riderId: string,
    input: { rating: number; comment?: string; metadata?: Record<string, any> },
  ) {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.rider_id !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }

    const status = String(delivery.order_status || '').toLowerCase();
    if (!['delivered', 'completed'].includes(status)) {
      throw new ConflictException(
        'Can only rate customers for completed deliveries',
      );
    }

    const customerId = String(delivery.created_by_user_id || '');
    if (!customerId) {
      throw new NotFoundException('No customer is linked to this delivery');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: riderId,
        entityType: 'CUSTOMER',
        customerId,
        contextType: 'delivery',
        contextId: deliveryId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already rated this customer');
    }

    const review = await this.prisma.review.create({
      data: {
        id: uuidv4(),
        userId: riderId,
        entityType: 'CUSTOMER',
        entityId: customerId,
        customerId,
        contextType: 'delivery',
        contextId: deliveryId,
        metadata: input.metadata,
        rating: input.rating,
        comment: input.comment?.trim() || undefined,
        updatedAt: new Date(),
      },
    });

    return {
      reviewId: review.id,
      rating: review.rating,
      comment: review.comment,
      customerId,
    };
  }

  /**
   * Cancel delivery
   */
  async cancelDelivery(
    deliveryId: string,
    userId: string,
    reason: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.created_by_user_id !== userId) {
      throw new ForbiddenException('Not authorized to cancel this delivery');
    }

    return this.cancelDeliveryRecord(
      delivery,
      reason,
      [delivery.created_by_user_id, delivery.rider_id],
    );
  }

  async cancelLinkedMarketplaceDelivery(
    deliveryId: string,
    reason: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return this.cancelDeliveryRecord(delivery, reason, [
      delivery.created_by_user_id,
      delivery.rider_id,
    ]);
  }

  private async cancelDeliveryRecord(
    delivery: DeliveryOrder,
    reason: string,
    recipients: Array<string | null | undefined>,
  ): Promise<DeliveryOrder> {
    if (this.isDeliveryCancelled(delivery)) {
      return delivery;
    }

    // Store cancellation info
    delivery.more_info = JSON.stringify({
      ...(delivery.more_info ? JSON.parse(delivery.more_info) : {}),
      cancelled: true,
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    });
    const updated = await this.deliveryRepository.update(delivery.id, delivery);

    const recipientIds = Array.from(
      new Set(recipients.filter(Boolean)),
    ) as string[];

    await Promise.all(
      recipientIds.map((recipientId) =>
        this.notificationsService.createNotification({
          userId: recipientId,
          title: 'Delivery cancelled',
          message: `Delivery ${delivery.id} was cancelled.`,
          type: 'DELIVERY_UPDATE',
          metadata: {
            entityType: 'delivery',
            entityId: delivery.id,
            sourceStatus: 'cancelled',
            statusLabel: 'Cancelled',
          },
        }),
      ),
    );

    return updated;
  }

  /**
   * Get delivery by ID
   */
  async getDeliveryById(deliveryId: string): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    (delivery as any).conversationId = await this.findConversationId(delivery.id);
    return delivery;
  }

  async findLinkedMarketplaceDelivery(
    marketplaceOrderId: string,
  ): Promise<DeliveryOrder | null> {
    const result = await this.deliveryRepository.findAll(
      {},
      { page: 1, size: 10000 },
    );

    return (
      result.data.find((delivery) => {
        try {
          const metadata = delivery.more_info ? JSON.parse(delivery.more_info) : {};
          return (
            String(metadata?.marketplace_order_id || '') ===
            String(marketplaceOrderId)
          );
        } catch {
          return false;
        }
      }) || null
    );
  }

  private isDeliveryCancelled(delivery: DeliveryOrder): boolean {
    try {
      const metadata = delivery.more_info ? JSON.parse(delivery.more_info) : {};
      return Boolean(metadata?.cancelled);
    } catch {
      return false;
    }
  }

  /**
   * Get config/limits
   */
  getConfig(): any {
    return {
      max_stops: 8,
      max_photos: 10,
      max_schedule_ahead_hours: 48,
      vehicle_types: Object.values(VehicleType),
      payment_methods: [
        'cash_on_delivery',
        'mobile_money',
        'card',
        'wallet',
        'bank_transfer',
      ],
      pricing: this.getPricingConfig(),
    };
  }

  private getPricingConfig() {
    return {
      currency: 'ZMW',
      pricing_model: 'distance_plus_vehicle',
      less_than_5km_minimum: 27,
      extra_stop_fee: 5,
      fragile_surcharge: 8,
      size_surcharges: {
        small: 0,
        medium: 6,
        large: 12,
      },
      vehicles: {
        walking: {
          base_fare: 12,
          per_km: 6,
          minimum_fare: 27,
          minutes_per_km: 14,
        },
        bicycle: {
          base_fare: 12,
          per_km: 6,
          minimum_fare: 27,
          minutes_per_km: 10,
        },
        motorbike: {
          base_fare: 12,
          per_km: 6,
          minimum_fare: 27,
          minutes_per_km: 7,
        },
        truck: {
          base_fare: 50,
          per_km: 10,
          minimum_fare: 50,
          minutes_per_km: 9,
        },
      },
    };
  }

  private calculateRouteDistanceKm(points: Array<{ lat: number; lng: number }>): number {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += this.calculateDistanceKm(points[index - 1], points[index]);
    }
    return total;
  }

  private calculateDistanceKm(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLng = this.toRadians(destination.lng - origin.lng);
    const lat1 = this.toRadians(origin.lat);
    const lat2 = this.toRadians(destination.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) *
        Math.sin(dLng / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private signPricingPayload(payload: Record<string, unknown>): string {
    return createHmac('sha256', this.pricingSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  private verifyPricingSignature(
    payload: Record<string, unknown>,
    signature: string,
  ): { valid: boolean; expired: boolean } {
    const expectedSignature = this.signPricingPayload(payload);
    const expiresAt = payload.expires_at ? new Date(String(payload.expires_at)) : null;
    const expired =
      !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now();

    return {
      valid: signature === expectedSignature,
      expired,
    };
  }

  private validateStops(stops: any[]): void {
    const pickups = stops.filter((s) => s.type === StopType.PICKUP);
    const dropoffs = stops.filter((s) => s.type === StopType.DROPOFF);

    if (pickups.length !== 1) {
      throw new BadRequestException('Exactly one pickup stop required');
    }

    if (dropoffs.length < 1) {
      throw new BadRequestException('At least one dropoff stop required');
    }

    if (pickups[0].sequence !== 0) {
      throw new BadRequestException('Pickup must have sequence 0');
    }

    for (const stop of stops) {
      if (!stop.geo && !stop.address) {
        throw new BadRequestException('Each stop must include geo OR address');
      }
    }
  }

  private validateScheduling(scheduled_at?: string): void {
    if (!scheduled_at) {
      throw new BadRequestException(
        'scheduled_at required when is_scheduled is true',
      );
    }

    const scheduledTime = new Date(scheduled_at);
    const now = new Date();
    const maxScheduleTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (scheduledTime <= now || scheduledTime > maxScheduleTime) {
      throw new BadRequestException(
        'scheduled_at must be within 48 hours from now',
      );
    }
  }

  private async findConversationId(contextId: string): Promise<string | null> {
    const conversation = await (this.prisma as any).conversation.findUnique({
      where: {
        contextType_contextId: {
          contextType: 'DELIVERY',
          contextId,
        },
      },
      select: { id: true },
    });

    return conversation?.id ?? null;
  }
}
