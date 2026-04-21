import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { DELIVERY_REPOSITORY } from '../../domain/repositories/delivery.repository.interface';
import type { IDeliveryRepository } from '../../domain/repositories/delivery.repository.interface';
import {
  DeliveryOrder,
  OrderStatus,
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
import { PricingService } from '../../../pricing/application/services/pricing.service';
import { DispatchService } from '../../../dispatch/application/services/dispatch.service';
import { DeliveriesGateway } from '../../infrastructure/websocket/deliveries.gateway';
import type { DispatchStatusDto } from '../../../dispatch/application/dtos/dispatch-status.dto';

type DeliveryDispatchState = {
  stage?: 'searching' | 'offered' | 'assigned' | 'failed';
  offeredTo?: string[];
  activeRiderId?: string | null;
  offerExpiresAt?: string | null;
  lastOfferedAt?: string | null;
  searchStartedAt?: string | null;
};

@Injectable()
export class DeliveryService implements OnModuleInit, OnModuleDestroy {
  private readonly pricingSecret =
    process.env.DELIVERY_PRICING_SECRET ||
    process.env.APP_KEY ||
    'ntumai-delivery-pricing-secret';
  private readonly offerTimeoutSweepMs = Number(
    process.env.DELIVERY_OFFER_SWEEP_MS ||
      process.env.MATCHING_OFFER_SWEEP_MS ||
      5000,
  );
  private readonly deliveryOfferTimeoutSec = Number(
    process.env.DELIVERY_OFFER_TIMEOUT_SEC || 45,
  );
  private readonly activeOfferTimeouts = new Set<string>();
  private offerSweepTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pricingService: PricingService,
    private readonly dispatchService: DispatchService,
    private readonly deliveriesGateway: DeliveriesGateway,
  ) {}

  onModuleInit() {
    this.offerSweepTimer = setInterval(() => {
      this.reassignExpiredOffers().catch((error) => {
        console.error('Delivery offer timeout sweep failed:', error);
      });
    }, this.offerTimeoutSweepMs);
  }

  onModuleDestroy() {
    if (this.offerSweepTimer) {
      clearInterval(this.offerSweepTimer);
      this.offerSweepTimer = null;
    }
  }

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
    const result = this.pricingService.estimateDelivery({
      points: dto.points,
      vehicleType: dto.vehicle_type,
      parcelSize: dto.parcel_size,
      fragile: dto.fragile,
    });
    return {
      ...result,
      calc_sig: this.signPricingPayload(result.calc_payload),
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

    await this.startDispatchProcess(updated);

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
      (delivery as any).conversationId = await this.findConversationId(
        delivery.id,
      );
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
    riderId: string,
    vehicle_type?: string,
  ): Promise<DeliveryOrder[]> {
    const deliveries = await this.deliveryRepository.findNearby(
      lat,
      lng,
      radius_km,
      vehicle_type,
    );

    return deliveries.filter((delivery) =>
      this.isDeliveryVisibleToRider(delivery, riderId),
    );
  }

  async getRiderDeliveryHistory(
    riderId: string,
    page: number = 1,
    size: number = 50,
  ): Promise<{
    data: Array<{
      id: string;
      createdAt: string;
      updatedAt: string;
      timelineAt: string;
      status:
        | 'completed'
        | 'cancelled'
        | 'released'
        | 'in_transit'
        | 'accepted';
      amount: number | null;
      currency: string | null;
      customerName: string | null;
      pickupAddress: string | null;
      dropoffAddress: string | null;
      pickupCompletedAt: string | null;
      dropoffCompletedAt: string | null;
    }>;
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const result = await this.deliveryRepository.findAll(
      { rider_id: riderId },
      { page, size },
    );

    return {
      ...result,
      data: result.data.map((delivery) =>
        this.toRiderHistoryItem(delivery, riderId),
      ),
    };
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

    const dispatchState = this.getDispatchState(delivery);
    if (
      dispatchState.activeRiderId &&
      dispatchState.activeRiderId !== riderId
    ) {
      throw new ForbiddenException(
        'This delivery offer is assigned to another rider',
      );
    }

    const offerExpiresAt = dispatchState.offerExpiresAt
      ? new Date(dispatchState.offerExpiresAt)
      : null;
    if (
      offerExpiresAt &&
      !Number.isNaN(offerExpiresAt.getTime()) &&
      offerExpiresAt.getTime() <= Date.now()
    ) {
      await this.expireOfferAndReassign(delivery, 'Delivery offer timed out');
      throw new ConflictException('Offer expired before it was accepted');
    }

    if (delivery.rider_id) {
      throw new BadRequestException(
        'Delivery already accepted by another rider',
      );
    }

    delivery.assignRider(riderId);
    this.updateDeliveryMetadata(delivery, (metadata) => ({
      ...metadata,
      dispatch: {
        ...this.getDispatchStateFromMetadata(metadata),
        stage: 'assigned',
        activeRiderId: riderId,
        offerExpiresAt: null,
      },
    }));
    const updated = await this.deliveryRepository.update(deliveryId, delivery);
    await this.dispatchService.incrementTaskerDispatchStat(
      riderId,
      'acceptedDeliveries',
    );

    await Promise.all([
      this.notificationsService.createNotification({
        userId: delivery.created_by_user_id,
        title: 'Delivery offer accepted',
        message: `A rider has accepted delivery ${deliveryId}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Rider Accepted',
        },
      }),
      this.notificationsService.createNotification({
        userId: riderId,
        title: 'Delivery offer accepted',
        message: `You accepted delivery ${deliveryId}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Offer Accepted',
        },
      }),
    ]);

    this.deliveriesGateway.emitDeliveryStatusUpdate(deliveryId, 'assigned', {
      riderId,
      customerId: delivery.created_by_user_id,
    });
    this.deliveriesGateway.emitRiderAssigned(deliveryId, { riderId });

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

    this.deliveriesGateway.emitInTransit(deliveryId, 1, delivery.stops.length);
    this.deliveriesGateway.emitDeliveryStatusUpdate(deliveryId, 'in_transit', {
      riderId,
      customerId: delivery.created_by_user_id,
    });

    return updated;
  }

  async releaseDelivery(
    deliveryId: string,
    riderId: string,
    reason?: string,
  ): Promise<DeliveryOrder> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.rider_id !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }

    if (String(delivery.order_status || '').toLowerCase() !== 'booked') {
      throw new BadRequestException(
        'Delivery can only be released before transit starts',
      );
    }

    delivery.rider_id = null;
    delivery.updated_at = new Date();

    const updatedMetadata = (() => {
      try {
        const parsed =
          delivery.more_info && typeof delivery.more_info === 'string'
            ? JSON.parse(delivery.more_info)
            : {};
        return {
          ...parsed,
          rider_release: {
            releasedBy: riderId,
            reason: reason?.trim() || null,
            releasedAt: new Date().toISOString(),
          },
        };
      } catch {
        return {
          rider_release: {
            releasedBy: riderId,
            reason: reason?.trim() || null,
            releasedAt: new Date().toISOString(),
          },
        };
      }
    })();

    delivery.more_info = JSON.stringify({
      ...updatedMetadata,
      dispatch: {
        ...this.getDispatchStateFromMetadata(updatedMetadata),
        stage: 'searching',
        activeRiderId: null,
        offerExpiresAt: null,
      },
    });
    const updated = await this.deliveryRepository.update(deliveryId, delivery);
    await this.dispatchService.incrementTaskerDispatchStat(
      riderId,
      'releasedDeliveries',
    );

    await Promise.all([
      this.notificationsService.createNotification({
        userId: delivery.created_by_user_id,
        title: 'Searching for another rider',
        message: `Your delivery ${deliveryId} is being reassigned to another rider.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Searching',
          notificationType: 'delivery_reassigned',
        },
      }),
      this.notificationsService.createNotification({
        userId: riderId,
        title: 'Delivery released',
        message: `You released delivery ${deliveryId}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: deliveryId,
          sourceStatus: 'booked',
          statusLabel: 'Released',
          notificationType: 'delivery_released',
        },
      }),
    ]);

    this.deliveriesGateway.emitDeliveryStatusUpdate(deliveryId, 'searching', {
      reason: reason?.trim() || null,
      customerId: delivery.created_by_user_id,
    });
    await this.reofferDelivery(deliveryId);

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

    return this.cancelDeliveryRecord(delivery, reason, [
      delivery.created_by_user_id,
      delivery.rider_id,
    ]);
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
    (delivery as any).conversationId = await this.findConversationId(
      delivery.id,
    );
    return delivery;
  }

  async getDispatchStatus(deliveryId: string): Promise<DispatchStatusDto> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const dispatchState = this.getDispatchState(delivery);
    const activeRiderId =
      delivery.rider_id || dispatchState.activeRiderId || null;
    const candidates = activeRiderId
      ? [
          await this.buildDispatchCandidate(
            activeRiderId,
            delivery.vehicle_type,
          ),
        ]
      : [];

    return {
      dispatchId: delivery.id,
      resourceType: 'delivery',
      customerId: delivery.created_by_user_id,
      stage: this.toDispatchStage(delivery, dispatchState),
      candidateCount:
        dispatchState.stage === 'offered'
          ? Math.max(1, dispatchState.offeredTo?.length || 0)
          : candidates.length,
      activeRiderId,
      candidates,
      message: this.toDispatchMessage(delivery, dispatchState),
      updatedAt: delivery.updated_at.toISOString(),
    };
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
          const metadata = delivery.more_info
            ? JSON.parse(delivery.more_info)
            : {};
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

  async ensureMarketplaceLinkedDelivery(input: {
    marketplaceOrderId: string;
    storeId: string;
    customerUserId: string;
    customerName: string;
    customerPhone?: string | null;
    storeAddress: {
      address?: string | null;
      city?: string | null;
      latitude: number;
      longitude: number;
    };
    customerAddress: {
      address?: string | null;
      city?: string | null;
      latitude: number;
      longitude: number;
    };
    scheduledAt?: Date | null;
  }): Promise<DeliveryOrder> {
    const existing = await this.findLinkedMarketplaceDelivery(
      input.marketplaceOrderId,
    );
    if (existing) {
      return existing;
    }

    const delivery = await this.createDelivery(
      {
        vehicle_type: VehicleType.MOTORBIKE,
        is_scheduled: Boolean(input.scheduledAt),
        scheduled_at: input.scheduledAt?.toISOString(),
        marketplace_order_id: input.marketplaceOrderId,
        store_id: input.storeId,
        courier_comment: 'Marketplace order ready for pickup',
        stops: [
          {
            type: StopType.PICKUP,
            sequence: 0,
            contact_name: 'Vendor pickup',
            contact_phone: null,
            notes: 'Collect the packed marketplace order from the vendor',
            geo: {
              lat: input.storeAddress.latitude,
              lng: input.storeAddress.longitude,
            },
            address: {
              line1:
                input.storeAddress.address ||
                input.storeAddress.city ||
                'Store',
              city: input.storeAddress.city || '',
              country: 'Zambia',
            },
          },
          {
            type: StopType.DROPOFF,
            sequence: 1,
            contact_name: input.customerName,
            contact_phone: input.customerPhone || null,
            notes: 'Deliver the marketplace order to the customer',
            geo: {
              lat: input.customerAddress.latitude,
              lng: input.customerAddress.longitude,
            },
            address: {
              line1:
                input.customerAddress.address ||
                input.customerAddress.city ||
                'Customer address',
              city: input.customerAddress.city || '',
              country: 'Zambia',
            },
          },
        ],
      } as CreateDeliveryDto,
      input.customerUserId,
      'customer',
    );

    await this.notificationsService.createNotification({
      userId: input.customerUserId,
      title: 'Looking for a rider',
      message: `Your marketplace order is packed and we are now looking for a rider.`,
      type: 'DELIVERY_UPDATE',
      metadata: {
        entityType: 'delivery',
        entityId: delivery.id,
        sourceStatus: 'booked',
        statusLabel: 'Matching Rider',
        marketplaceOrderId: input.marketplaceOrderId,
        notificationType: 'marketplace_dispatch_started',
      },
    });

    await this.startDispatchProcess(delivery);

    return delivery;
  }

  private async startDispatchProcess(delivery: DeliveryOrder): Promise<void> {
    if (
      delivery.rider_id ||
      String(delivery.order_status).toLowerCase() !== 'booked'
    ) {
      return;
    }
    const existingDispatch = this.getDispatchState(delivery);
    if (
      existingDispatch.stage === 'offered' ||
      existingDispatch.stage === 'assigned'
    ) {
      return;
    }

    const pickup = delivery.stops.find((stop) => stop.type === StopType.PICKUP);
    if (!pickup?.geo) {
      return;
    }

    this.updateDeliveryMetadata(delivery, (metadata) => ({
      ...metadata,
      dispatch: {
        ...this.getDispatchStateFromMetadata(metadata),
        stage: 'searching',
        searchStartedAt:
          this.getDispatchStateFromMetadata(metadata).searchStartedAt ||
          new Date().toISOString(),
      },
    }));
    await this.deliveryRepository.update(delivery.id, delivery);

    this.deliveriesGateway.emitDeliveryStatusUpdate(delivery.id, 'searching', {
      message: 'Looking for a rider now.',
      customerId: delivery.created_by_user_id,
    });

    const candidates = await this.dispatchService.rankTaskersForJob({
      jobId: delivery.id,
      jobType: 'delivery',
      pickup: pickup.geo,
      vehicleType: delivery.vehicle_type,
      radiusKm: 10,
    });

    if (candidates.length === 0) {
      await this.markDispatchFailed(delivery, 'No riders available right now');
      return;
    }

    await this.offerDeliveryToCandidate(
      delivery,
      candidates[0],
      candidates.length,
    );
  }

  private async reofferDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.deliveryRepository.findById(deliveryId);
    if (!delivery || delivery.rider_id) {
      return;
    }

    const pickup = delivery.stops.find((stop) => stop.type === StopType.PICKUP);
    if (!pickup?.geo) {
      return;
    }

    const dispatchState = this.getDispatchState(delivery);
    const alreadyOfferedTo = Array.isArray(dispatchState.offeredTo)
      ? dispatchState.offeredTo
      : [];

    const candidates = await this.dispatchService.rankTaskersForJob({
      jobId: delivery.id,
      jobType: this.getMarketplaceOrderId(delivery)
        ? 'marketplace_order'
        : 'delivery',
      pickup: pickup.geo,
      vehicleType: delivery.vehicle_type,
      radiusKm: 10,
    });
    const nextCandidate = candidates.find(
      (candidate) => !alreadyOfferedTo.includes(candidate.user_id),
    );

    if (!nextCandidate) {
      await this.markDispatchFailed(
        delivery,
        'No more riders available right now',
      );
      return;
    }

    await this.offerDeliveryToCandidate(
      delivery,
      nextCandidate,
      candidates.length,
    );
  }

  private async offerDeliveryToCandidate(
    delivery: DeliveryOrder,
    candidate: {
      user_id: string;
      name: string;
      phone: string;
      rating: number;
      eta_min: number;
    },
    candidateCount: number,
  ): Promise<void> {
    const now = new Date();
    const offerExpiresAt = new Date(
      now.getTime() + this.deliveryOfferTimeoutSec * 1000,
    );
    this.updateDeliveryMetadata(delivery, (metadata) => {
      const existingDispatch = this.getDispatchStateFromMetadata(metadata);
      const offeredTo = Array.isArray(existingDispatch.offeredTo)
        ? existingDispatch.offeredTo
        : [];
      return {
        ...metadata,
        dispatch: {
          ...existingDispatch,
          stage: 'offered',
          offeredTo: [...new Set([...offeredTo, candidate.user_id])],
          activeRiderId: candidate.user_id,
          offerExpiresAt: offerExpiresAt.toISOString(),
          lastOfferedAt: now.toISOString(),
          searchStartedAt:
            existingDispatch.searchStartedAt || now.toISOString(),
        },
      };
    });

    await this.deliveryRepository.update(delivery.id, delivery);
    await this.dispatchService.incrementTaskerDispatchStat(
      candidate.user_id,
      'offersReceived',
    );

    await Promise.all([
      this.notificationsService.createNotification({
        userId: candidate.user_id,
        title: 'New delivery offer',
        message: `A delivery near you is ready for pickup.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: delivery.id,
          notificationType: 'job_offer',
          targetRole: 'tasker',
          jobId: delivery.id,
          jobType: this.getMarketplaceOrderId(delivery)
            ? 'marketplace_order'
            : 'delivery',
          etaMin: candidate.eta_min,
        },
      }),
      this.notificationsService.createNotification({
        userId: delivery.created_by_user_id,
        title: 'Rider is reviewing your delivery',
        message: `${candidate.name} is reviewing delivery ${delivery.id}.`,
        type: 'DELIVERY_UPDATE',
        metadata: {
          entityType: 'delivery',
          entityId: delivery.id,
          sourceStatus: 'booked',
          statusLabel: 'Rider Reviewing',
          activeRiderId: candidate.user_id,
          candidateCount,
        },
      }),
    ]);

    this.deliveriesGateway.emitDeliveryStatusUpdate(delivery.id, 'offer_sent', {
      riderId: candidate.user_id,
      riderName: candidate.name,
      etaMin: candidate.eta_min,
      candidateCount,
      offerExpiresAt: offerExpiresAt.toISOString(),
      customerId: delivery.created_by_user_id,
    });
  }

  private async reassignExpiredOffers(): Promise<void> {
    const result = await this.deliveryRepository.findAll(
      { order_status: OrderStatus.BOOKED },
      { page: 1, size: 1000 },
    );
    const now = Date.now();

    await Promise.all(
      result.data.map(async (delivery) => {
        const dispatchState = this.getDispatchState(delivery);
        if (
          dispatchState.stage !== 'offered' ||
          !dispatchState.offerExpiresAt
        ) {
          return;
        }

        const expiresAt = new Date(dispatchState.offerExpiresAt);
        if (
          Number.isNaN(expiresAt.getTime()) ||
          expiresAt.getTime() > now ||
          this.activeOfferTimeouts.has(delivery.id)
        ) {
          return;
        }

        this.activeOfferTimeouts.add(delivery.id);
        try {
          await this.expireOfferAndReassign(
            delivery,
            'Delivery offer timed out',
          );
        } finally {
          this.activeOfferTimeouts.delete(delivery.id);
        }
      }),
    );
  }

  private async expireOfferAndReassign(
    delivery: DeliveryOrder,
    reason: string,
  ): Promise<void> {
    if (delivery.rider_id) {
      return;
    }

    const dispatchState = this.getDispatchState(delivery);
    const timedOutRiderId = dispatchState.activeRiderId || null;
    this.updateDeliveryMetadata(delivery, (metadata) => ({
      ...metadata,
      dispatch: {
        ...this.getDispatchStateFromMetadata(metadata),
        stage: 'searching',
        activeRiderId: null,
        offerExpiresAt: null,
      },
    }));
    await this.deliveryRepository.update(delivery.id, delivery);

    if (timedOutRiderId) {
      await this.dispatchService.incrementTaskerDispatchStat(
        timedOutRiderId,
        'timedOutOffers',
      );
    }

    await this.notificationsService.createNotification({
      userId: delivery.created_by_user_id,
      title: 'Looking for another rider',
      message: `The previous rider did not respond in time for delivery ${delivery.id}.`,
      type: 'DELIVERY_UPDATE',
      metadata: {
        entityType: 'delivery',
        entityId: delivery.id,
        sourceStatus: 'booked',
        statusLabel: 'Matching Rider',
        reason,
      },
    });

    this.deliveriesGateway.emitDeliveryStatusUpdate(delivery.id, 'searching', {
      reason,
      customerId: delivery.created_by_user_id,
    });
    await this.reofferDelivery(delivery.id);
  }

  private async markDispatchFailed(
    delivery: DeliveryOrder,
    reason: string,
  ): Promise<void> {
    this.updateDeliveryMetadata(delivery, (metadata) => ({
      ...metadata,
      dispatch: {
        ...this.getDispatchStateFromMetadata(metadata),
        stage: 'failed',
        activeRiderId: null,
        offerExpiresAt: null,
      },
    }));
    await this.deliveryRepository.update(delivery.id, delivery);

    await this.notificationsService.createNotification({
      userId: delivery.created_by_user_id,
      title: 'No rider available',
      message: `Delivery ${delivery.id} could not find an available rider right now.`,
      type: 'DELIVERY_UPDATE',
      metadata: {
        entityType: 'delivery',
        entityId: delivery.id,
        sourceStatus: 'searching_failed',
        statusLabel: 'No Rider Available',
      },
    });

    this.deliveriesGateway.emitDeliveryStatusUpdate(delivery.id, 'failed', {
      reason,
      customerId: delivery.created_by_user_id,
    });
  }

  private isDeliveryVisibleToRider(
    delivery: DeliveryOrder,
    riderId: string,
  ): boolean {
    if (delivery.rider_id && delivery.rider_id !== riderId) {
      return false;
    }

    const dispatchState = this.getDispatchState(delivery);
    if (dispatchState.activeRiderId) {
      const offerExpiresAt = dispatchState.offerExpiresAt
        ? new Date(dispatchState.offerExpiresAt)
        : null;
      if (
        offerExpiresAt &&
        !Number.isNaN(offerExpiresAt.getTime()) &&
        offerExpiresAt.getTime() <= Date.now()
      ) {
        return false;
      }
      return dispatchState.activeRiderId === riderId;
    }

    return !delivery.rider_id;
  }

  private getDispatchState(delivery: DeliveryOrder): DeliveryDispatchState {
    return this.getDispatchStateFromMetadata(
      this.parseDeliveryMetadata(delivery),
    );
  }

  private getDispatchStateFromMetadata(
    metadata: Record<string, any>,
  ): DeliveryDispatchState {
    const dispatch =
      metadata?.dispatch && typeof metadata.dispatch === 'object'
        ? (metadata.dispatch as DeliveryDispatchState)
        : {};
    return {
      stage: dispatch.stage,
      offeredTo: Array.isArray(dispatch.offeredTo) ? dispatch.offeredTo : [],
      activeRiderId: dispatch.activeRiderId || null,
      offerExpiresAt: dispatch.offerExpiresAt || null,
      lastOfferedAt: dispatch.lastOfferedAt || null,
      searchStartedAt: dispatch.searchStartedAt || null,
    };
  }

  private parseDeliveryMetadata(delivery: DeliveryOrder): Record<string, any> {
    try {
      return delivery.more_info ? JSON.parse(delivery.more_info) : {};
    } catch {
      return {};
    }
  }

  private updateDeliveryMetadata(
    delivery: DeliveryOrder,
    updater: (metadata: Record<string, any>) => Record<string, any>,
  ): void {
    const currentMetadata = this.parseDeliveryMetadata(delivery);
    delivery.more_info = JSON.stringify(updater(currentMetadata));
    delivery.updated_at = new Date();
  }

  private getMarketplaceOrderId(delivery: DeliveryOrder): string | null {
    const metadata = this.parseDeliveryMetadata(delivery);
    return metadata.marketplace_order_id
      ? String(metadata.marketplace_order_id)
      : null;
  }

  private async buildDispatchCandidate(
    riderUserId: string,
    vehicleType: string,
  ): Promise<DispatchStatusDto['candidates'][number]> {
    const [user, aggregateRating] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: riderUserId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      }),
      this.prisma.review.aggregate({
        where: { driverId: riderUserId },
        _avg: { rating: true },
      }),
    ]);

    return {
      riderId: riderUserId,
      name:
        (user &&
          (`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Rider')) ||
        'Rider',
      vehicle: vehicleType,
      phone: user?.phone || undefined,
      rating: Number(aggregateRating._avg.rating || 4.5),
    };
  }

  private toDispatchStage(
    delivery: DeliveryOrder,
    dispatchState: DeliveryDispatchState,
  ): DispatchStatusDto['stage'] {
    if (this.isDeliveryCancelled(delivery)) {
      return 'cancelled';
    }
    if (String(delivery.order_status).toLowerCase() === 'delivery') {
      return 'in_transit';
    }
    switch (dispatchState.stage) {
      case 'searching':
        return 'searching';
      case 'offered':
        return dispatchState.offeredTo && dispatchState.offeredTo.length > 1
          ? 'reoffered'
          : 'offer_sent';
      case 'assigned':
        return 'assigned';
      case 'failed':
        return 'failed';
      default:
        return delivery.rider_id ? 'assigned' : 'searching';
    }
  }

  private toDispatchMessage(
    delivery: DeliveryOrder,
    dispatchState: DeliveryDispatchState,
  ): string {
    const stage = this.toDispatchStage(delivery, dispatchState);
    switch (stage) {
      case 'searching':
        return 'Looking for a rider now.';
      case 'offer_sent':
      case 'reoffered':
        return 'A rider is reviewing the delivery.';
      case 'assigned':
        return 'A rider has accepted the delivery.';
      case 'in_transit':
        return 'Delivery is in transit.';
      case 'failed':
        return 'No rider is currently available.';
      case 'cancelled':
        return 'This delivery was cancelled.';
      default:
        return 'Dispatch status updated.';
    }
  }

  private isDeliveryCancelled(delivery: DeliveryOrder): boolean {
    try {
      const metadata = delivery.more_info ? JSON.parse(delivery.more_info) : {};
      return Boolean(metadata?.cancelled);
    } catch {
      return false;
    }
  }

  private toRiderHistoryItem(delivery: DeliveryOrder, riderId: string) {
    const metadata = this.parseDeliveryMetadata(delivery);
    const pickup = delivery.stops.find((stop) => stop.type === StopType.PICKUP);
    const dropoff = delivery.stops.find(
      (stop) => stop.type === StopType.DROPOFF,
    );
    const pickupCompletedAt = pickup?.completed_at
      ? pickup.completed_at.toISOString()
      : null;
    const dropoffCompletedAt = dropoff?.completed_at
      ? dropoff.completed_at.toISOString()
      : null;
    const timelineAt =
      dropoffCompletedAt ||
      pickupCompletedAt ||
      metadata?.completed_at ||
      metadata?.cancelled_at ||
      metadata?.rider_release?.releasedAt ||
      delivery.updated_at.toISOString();

    return {
      id: delivery.id,
      createdAt: delivery.created_at.toISOString(),
      updatedAt: delivery.updated_at.toISOString(),
      timelineAt: String(timelineAt),
      status: this.toRiderHistoryStatus(delivery, riderId),
      amount: delivery.payment?.amount ?? null,
      currency: delivery.payment?.currency ?? null,
      customerName: dropoff?.contact_name || null,
      pickupAddress: this.formatStopAddress(pickup),
      dropoffAddress: this.formatStopAddress(dropoff),
      pickupCompletedAt,
      dropoffCompletedAt,
    };
  }

  private toRiderHistoryStatus(
    delivery: DeliveryOrder,
    riderId: string,
  ): 'completed' | 'cancelled' | 'released' | 'in_transit' | 'accepted' {
    const metadata = this.parseDeliveryMetadata(delivery);
    const dropoffs = delivery.stops.filter((stop) => stop.type === StopType.DROPOFF);
    const allDropoffsCompleted =
      dropoffs.length > 0 && dropoffs.every((stop) => stop.isCompleted());

    if (
      allDropoffsCompleted ||
      ['completed', 'delivered'].includes(
        String(metadata?.sourceStatus || '').toLowerCase(),
      ) ||
      metadata?.completed_at
    ) {
      return 'completed';
    }

    if (this.isDeliveryCancelled(delivery)) {
      return 'cancelled';
    }

    if (
      String(metadata?.rider_release?.releasedBy || '') === String(riderId)
    ) {
      return 'released';
    }

    if (String(delivery.order_status || '').toLowerCase() === 'delivery') {
      return 'in_transit';
    }

    return 'accepted';
  }

  private formatStopAddress(stop?: Stop): string | null {
    if (!stop) {
      return null;
    }

    const line1 = stop.address?.line1?.trim();
    const city = stop.address?.city?.trim();
    return line1 || city || stop.notes || null;
  }

  /**
   * Get config/limits
   */
  getConfig(): any {
    return {
      max_stops: 8,
      max_photos: 10,
      max_schedule_ahead_hours: 120,
      vehicle_types: Object.values(VehicleType),
      payment_methods: [
        'cash_on_delivery',
        'mobile_money',
        'card',
        'wallet',
        'bank_transfer',
      ],
      pricing: this.pricingService.getDeliveryPricingConfig(),
    };
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
    const expiresAt = payload.expires_at
      ? new Date(String(payload.expires_at))
      : null;
    const expired =
      !expiresAt ||
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now();

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
    const maxScheduleTime = new Date(now.getTime() + 120 * 60 * 60 * 1000);

    if (scheduledTime <= now || scheduledTime > maxScheduleTime) {
      throw new BadRequestException(
        'scheduled_at must be within 5 days from now',
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
