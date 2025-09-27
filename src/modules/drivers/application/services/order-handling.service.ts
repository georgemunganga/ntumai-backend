import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RiderOrderRepository } from '../../domain/repositories/rider-order.repository';
import { RiderRepository } from '../../domain/repositories/rider.repository';
import { OrderAssignmentService } from '../../domain/services/order-assignment.service';
import { RiderOrder } from '../../domain/entities/rider-order.entity';
import { Location } from '../../domain/value-objects/location.vo';

export interface OrderAssignmentRequest {
  orderId: string;
  riderId?: string; // If not provided, system will auto-assign
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  estimatedDistance?: number;
  estimatedDuration?: number;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface OrderAcceptanceRequest {
  riderOrderId: string;
  riderId: string;
  acceptedAt?: Date;
}

export interface OrderRejectionRequest {
  riderOrderId: string;
  riderId: string;
  reason: string;
  rejectedAt?: Date;
}

export interface OrderPickupRequest {
  riderOrderId: string;
  riderId: string;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  pickupNotes?: string;
  pickedUpAt?: Date;
}

export interface OrderDeliveryRequest {
  riderOrderId: string;
  riderId: string;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryProofType?: 'photo' | 'signature' | 'pin';
  deliveryProofData?: string;
  deliveryNotes?: string;
  customerRating?: number;
  customerFeedback?: string;
  deliveredAt?: Date;
}

export interface OrderCancellationRequest {
  riderOrderId: string;
  riderId: string;
  reason: string;
  cancelledAt?: Date;
}

export interface RiderOrderResponse {
  id: string;
  riderId: string;
  orderId: string;
  status: string;
  assignedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  rejectionReason?: string;
  cancellationReason?: string;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedDistance?: number;
  actualDistance?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  deliveryInfo?: {
    proofType?: string;
    proofData?: string;
    notes?: string;
    customerRating?: number;
    customerFeedback?: string;
  };
  earnings: {
    basePay: number;
    distanceBonus: number;
    timeBonus: number;
    peakHourBonus: number;
    tip: number;
    totalEarnings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListResponse {
  orders: RiderOrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  riderId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minEarnings?: number;
  maxEarnings?: number;
  customerRating?: number;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface OrderSummaryResponse {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  totalEarnings: number;
  averageEarnings: number;
  averageRating: number;
  averageDeliveryTime: number;
  completionRate: number;
  acceptanceRate: number;
}

export interface NearbyOrdersRequest {
  riderId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // in kilometers, default 10
  limit?: number; // default 20
}

export interface BatchOrderAssignmentRequest {
  orderIds: string[];
  criteria?: {
    maxDistance?: number;
    preferredRiderIds?: string[];
    excludeRiderIds?: string[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  };
}

export interface BatchOrderAssignmentResponse {
  successful: Array<{
    orderId: string;
    riderId: string;
    riderOrderId: string;
  }>;
  failed: Array<{
    orderId: string;
    reason: string;
  }>;
  summary: {
    totalOrders: number;
    successfulAssignments: number;
    failedAssignments: number;
  };
}

@Injectable()
export class OrderHandlingService {
  constructor(
    private readonly riderOrderRepository: RiderOrderRepository,
    private readonly riderRepository: RiderRepository,
    private readonly orderAssignmentService: OrderAssignmentService,
  ) {}

  async assignOrder(request: OrderAssignmentRequest): Promise<RiderOrderResponse> {
    // If riderId is provided, assign directly
    if (request.riderId) {
      return this.assignOrderToRider(request.orderId, request.riderId, request);
    }

    // Auto-assign using domain service
    const assignmentRequest = {
      orderId: request.orderId,
      priority: request.priority || 'NORMAL',
      estimatedDistance: request.estimatedDistance,
      estimatedDuration: request.estimatedDuration,
      pickupLocation: request.pickupLocation,
      deliveryLocation: request.deliveryLocation,
    };

    const assignmentResult = await this.orderAssignmentService.assignOrder(assignmentRequest);

    if (!assignmentResult.success) {
      throw new BadRequestException(`Failed to assign order: ${assignmentResult.reason}`);
    }

    return this.assignOrderToRider(request.orderId, assignmentResult.riderId!, request);
  }

  private async assignOrderToRider(
    orderId: string,
    riderId: string,
    request: OrderAssignmentRequest,
  ): Promise<RiderOrderResponse> {
    // Validate rider exists and is available
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    if (!rider.getIsActive() || rider.getStatus().getValue() === 'OFFLINE') {
      throw new BadRequestException('Rider is not available for orders');
    }

    // Check if order is already assigned
    const existingAssignment = await this.riderOrderRepository.findByOrderId(orderId);
    if (existingAssignment) {
      throw new ConflictException('Order is already assigned to a rider');
    }

    // Create rider order
    const pickupLocation = request.pickupLocation
      ? Location.create(request.pickupLocation.latitude, request.pickupLocation.longitude)
      : null;

    const deliveryLocation = request.deliveryLocation
      ? Location.create(request.deliveryLocation.latitude, request.deliveryLocation.longitude)
      : null;

    const riderOrder = new RiderOrder(
      '', // ID will be generated
      riderId,
      orderId,
      'ASSIGNED',
      new Date(),
      pickupLocation,
      deliveryLocation,
      request.estimatedDistance,
      request.estimatedDuration,
    );

    const savedRiderOrder = await this.riderOrderRepository.save(riderOrder);
    return this.mapToRiderOrderResponse(savedRiderOrder);
  }

  async acceptOrder(request: OrderAcceptanceRequest): Promise<RiderOrderResponse> {
    const riderOrder = await this.getRiderOrderForRider(request.riderOrderId, request.riderId);

    if (riderOrder.getStatus() !== 'ASSIGNED') {
      throw new BadRequestException('Order cannot be accepted in current status');
    }

    riderOrder.accept(request.acceptedAt);
    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async rejectOrder(request: OrderRejectionRequest): Promise<RiderOrderResponse> {
    const riderOrder = await this.getRiderOrderForRider(request.riderOrderId, request.riderId);

    if (riderOrder.getStatus() !== 'ASSIGNED') {
      throw new BadRequestException('Order cannot be rejected in current status');
    }

    riderOrder.reject(request.reason, request.rejectedAt);
    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async pickupOrder(request: OrderPickupRequest): Promise<RiderOrderResponse> {
    const riderOrder = await this.getRiderOrderForRider(request.riderOrderId, request.riderId);

    if (riderOrder.getStatus() !== 'ACCEPTED') {
      throw new BadRequestException('Order cannot be picked up in current status');
    }

    const pickupLocation = request.pickupLocation
      ? Location.create(request.pickupLocation.latitude, request.pickupLocation.longitude)
      : null;

    riderOrder.pickup(pickupLocation, request.pickupNotes, request.pickedUpAt);
    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async deliverOrder(request: OrderDeliveryRequest): Promise<RiderOrderResponse> {
    const riderOrder = await this.getRiderOrderForRider(request.riderOrderId, request.riderId);

    if (riderOrder.getStatus() !== 'PICKED_UP') {
      throw new BadRequestException('Order cannot be delivered in current status');
    }

    const deliveryLocation = request.deliveryLocation
      ? Location.create(request.deliveryLocation.latitude, request.deliveryLocation.longitude)
      : null;

    riderOrder.deliver(
      deliveryLocation,
      request.deliveryProofType,
      request.deliveryProofData,
      request.deliveryNotes,
      request.customerRating,
      request.customerFeedback,
      request.deliveredAt,
    );

    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    // Update rider performance metrics
    const rider = await this.riderRepository.findById(request.riderId);
    if (rider) {
      rider.incrementCompletedOrders();
      if (request.customerRating) {
        rider.updateRating(request.customerRating);
      }
      await this.riderRepository.save(rider);
    }

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async cancelOrder(request: OrderCancellationRequest): Promise<RiderOrderResponse> {
    const riderOrder = await this.getRiderOrderForRider(request.riderOrderId, request.riderId);

    const allowedStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKED_UP'];
    if (!allowedStatuses.includes(riderOrder.getStatus())) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    riderOrder.cancel(request.reason, request.cancelledAt);
    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    // Update rider performance metrics
    const rider = await this.riderRepository.findById(request.riderId);
    if (rider) {
      rider.incrementCancelledOrders();
      await this.riderRepository.save(rider);
    }

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async getRiderOrder(riderOrderId: string): Promise<RiderOrderResponse> {
    const riderOrder = await this.riderOrderRepository.findById(riderOrderId);
    if (!riderOrder) {
      throw new NotFoundException('Rider order not found');
    }

    return this.mapToRiderOrderResponse(riderOrder);
  }

  async getRiderOrders(
    riderId: string,
    page: number = 1,
    limit: number = 20,
    filters?: Omit<OrderFilters, 'riderId'>,
  ): Promise<OrderListResponse> {
    const orderFilters: OrderFilters = {
      ...filters,
      riderId,
    };

    const { orders, total } = await this.riderOrderRepository.searchOrders(orderFilters, {
      page,
      limit,
    });

    const orderResponses = orders.map(order => this.mapToRiderOrderResponse(order));

    return {
      orders: orderResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActiveOrders(riderId: string): Promise<RiderOrderResponse[]> {
    const activeOrders = await this.riderOrderRepository.findActiveOrdersByRiderId(riderId);
    return activeOrders.map(order => this.mapToRiderOrderResponse(order));
  }

  async getNearbyOrders(request: NearbyOrdersRequest): Promise<RiderOrderResponse[]> {
    const nearbyOrders = await this.riderOrderRepository.findNearbyAvailableOrders(
      request.location.latitude,
      request.location.longitude,
      request.radius || 10,
      request.limit || 20,
    );

    return nearbyOrders.map(order => this.mapToRiderOrderResponse(order));
  }

  async getOrderSummary(
    riderId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OrderSummaryResponse> {
    const summary = await this.riderOrderRepository.getOrderSummary(riderId, startDate, endDate);

    return {
      totalOrders: summary.totalOrders,
      completedOrders: summary.completedOrders,
      cancelledOrders: summary.cancelledOrders,
      rejectedOrders: summary.rejectedOrders,
      totalEarnings: summary.totalEarnings,
      averageEarnings: summary.totalOrders > 0 ? summary.totalEarnings / summary.totalOrders : 0,
      averageRating: summary.averageRating,
      averageDeliveryTime: summary.averageDeliveryTime,
      completionRate: summary.totalOrders > 0 ? summary.completedOrders / summary.totalOrders : 0,
      acceptanceRate: summary.totalAssigned > 0 ? (summary.totalAssigned - summary.rejectedOrders) / summary.totalAssigned : 0,
    };
  }

  async reassignOrder(
    riderOrderId: string,
    newRiderId: string,
    reason: string,
  ): Promise<RiderOrderResponse> {
    const riderOrder = await this.riderOrderRepository.findById(riderOrderId);
    if (!riderOrder) {
      throw new NotFoundException('Rider order not found');
    }

    // Validate new rider
    const newRider = await this.riderRepository.findById(newRiderId);
    if (!newRider) {
      throw new NotFoundException('New rider not found');
    }

    if (!newRider.getIsActive() || newRider.getStatus().getValue() === 'OFFLINE') {
      throw new BadRequestException('New rider is not available for orders');
    }

    // Use domain service for reassignment
    const reassignmentRequest = {
      riderOrderId,
      currentRiderId: riderOrder.getRiderId(),
      newRiderId,
      reason,
    };

    const reassignmentResult = await this.orderAssignmentService.reassignOrder(reassignmentRequest);

    if (!reassignmentResult.success) {
      throw new BadRequestException(`Failed to reassign order: ${reassignmentResult.reason}`);
    }

    // Update rider order
    riderOrder.reassign(newRiderId, reason);
    const updatedRiderOrder = await this.riderOrderRepository.save(riderOrder);

    return this.mapToRiderOrderResponse(updatedRiderOrder);
  }

  async batchAssignOrders(request: BatchOrderAssignmentRequest): Promise<BatchOrderAssignmentResponse> {
    const batchRequest = {
      orderIds: request.orderIds,
      criteria: request.criteria,
    };

    const batchResult = await this.orderAssignmentService.batchAssignOrders(batchRequest);

    const successful: Array<{ orderId: string; riderId: string; riderOrderId: string }> = [];
    const failed: Array<{ orderId: string; reason: string }> = [];

    for (const result of batchResult.results) {
      if (result.success) {
        // Create rider order for successful assignment
        try {
          const riderOrder = new RiderOrder(
            '',
            result.riderId!,
            result.orderId,
            'ASSIGNED',
            new Date(),
          );
          const savedRiderOrder = await this.riderOrderRepository.save(riderOrder);
          successful.push({
            orderId: result.orderId,
            riderId: result.riderId!,
            riderOrderId: savedRiderOrder.getId(),
          });
        } catch (error) {
          failed.push({
            orderId: result.orderId,
            reason: 'Failed to create rider order assignment',
          });
        }
      } else {
        failed.push({
          orderId: result.orderId,
          reason: result.reason || 'Assignment failed',
        });
      }
    }

    return {
      successful,
      failed,
      summary: {
        totalOrders: request.orderIds.length,
        successfulAssignments: successful.length,
        failedAssignments: failed.length,
      },
    };
  }

  private async getRiderOrderForRider(riderOrderId: string, riderId: string): Promise<RiderOrder> {
    const riderOrder = await this.riderOrderRepository.findById(riderOrderId);
    if (!riderOrder) {
      throw new NotFoundException('Rider order not found');
    }

    if (riderOrder.getRiderId() !== riderId) {
      throw new BadRequestException('Order does not belong to this rider');
    }

    return riderOrder;
  }

  private mapToRiderOrderResponse(riderOrder: RiderOrder): RiderOrderResponse {
    return {
      id: riderOrder.getId(),
      riderId: riderOrder.getRiderId(),
      orderId: riderOrder.getOrderId(),
      status: riderOrder.getStatus(),
      assignedAt: riderOrder.getAssignedAt(),
      acceptedAt: riderOrder.getAcceptedAt(),
      rejectedAt: riderOrder.getRejectedAt(),
      pickedUpAt: riderOrder.getPickedUpAt(),
      deliveredAt: riderOrder.getDeliveredAt(),
      cancelledAt: riderOrder.getCancelledAt(),
      rejectionReason: riderOrder.getRejectionReason(),
      cancellationReason: riderOrder.getCancellationReason(),
      pickupLocation: riderOrder.getPickupLocation() ? {
        latitude: riderOrder.getPickupLocation()!.getLatitude(),
        longitude: riderOrder.getPickupLocation()!.getLongitude(),
      } : undefined,
      deliveryLocation: riderOrder.getDeliveryLocation() ? {
        latitude: riderOrder.getDeliveryLocation()!.getLatitude(),
        longitude: riderOrder.getDeliveryLocation()!.getLongitude(),
      } : undefined,
      estimatedDistance: riderOrder.getEstimatedDistance(),
      actualDistance: riderOrder.getActualDistance(),
      estimatedDuration: riderOrder.getEstimatedDuration(),
      actualDuration: riderOrder.getActualDuration(),
      deliveryInfo: riderOrder.getDeliveryProofType() ? {
        proofType: riderOrder.getDeliveryProofType(),
        proofData: riderOrder.getDeliveryProofData(),
        notes: riderOrder.getDeliveryNotes(),
        customerRating: riderOrder.getCustomerRating(),
        customerFeedback: riderOrder.getCustomerFeedback(),
      } : undefined,
      earnings: {
        basePay: riderOrder.getBasePay(),
        distanceBonus: riderOrder.getDistanceBonus(),
        timeBonus: riderOrder.getTimeBonus(),
        peakHourBonus: riderOrder.getPeakHourBonus(),
        tip: riderOrder.getTip(),
        totalEarnings: riderOrder.getTotalEarnings(),
      },
      createdAt: riderOrder.getCreatedAt(),
      updatedAt: riderOrder.getUpdatedAt(),
    };
  }
}