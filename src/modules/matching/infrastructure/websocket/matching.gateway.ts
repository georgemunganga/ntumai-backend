import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type {
  DispatchCandidateDto,
  DispatchStatusDto,
} from '../../../dispatch/application/dtos/dispatch-status.dto';

type RiderLocationSnapshot = {
  lat: number;
  lng: number;
  updatedAt: string;
};

type MatchingCandidateSnapshot = DispatchCandidateDto;

type MatchingSnapshotPayload = {
  bookingId: string;
  customerId: string;
  stage: 'searching' | 'candidates_found' | 'offer_sent' | 'reoffered';
  candidateCount: number;
  activeRiderId?: string;
  candidates: MatchingCandidateSnapshot[];
  message?: string;
  timestamp: string;
};

@WebSocketGateway({
  namespace: '/matching',
  cors: {
    origin: '*',
  },
})
export class MatchingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchingGateway.name);
  private riderSockets: Map<string, string> = new Map(); // riderId -> socketId
  private customerSockets: Map<string, string> = new Map(); // customerId -> socketId
  private riderLocations: Map<string, RiderLocationSnapshot> = new Map();
  private bookingSnapshots: Map<string, MatchingSnapshotPayload> = new Map();

  private emitDispatchSnapshot(
    target: { customerId?: string; bookingId: string },
    snapshot: DispatchStatusDto,
  ) {
    if (target.customerId) {
      this.server
        .to(`customer:${target.customerId}`)
        .emit('dispatch:snapshot', snapshot);
    }
    this.server
      .to(`booking:${target.bookingId}`)
      .emit('dispatch:snapshot', snapshot);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to matching: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from matching: ${client.id}`);

    // Clean up rider sockets
    for (const [riderId, socketId] of this.riderSockets.entries()) {
      if (socketId === client.id) {
        this.riderSockets.delete(riderId);
        this.riderLocations.delete(riderId);
        this.logger.log(`Rider ${riderId} went offline`);
      }
    }

    // Clean up customer sockets
    for (const [customerId, socketId] of this.customerSockets.entries()) {
      if (socketId === client.id) {
        this.customerSockets.delete(customerId);
      }
    }
  }

  @SubscribeMessage('rider:online')
  handleRiderOnline(
    @MessageBody() data: { riderId: string; location?: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, location } = data;

    this.riderSockets.set(riderId, client.id);
    client.join(`rider:${riderId}`);
    if (location?.lat != null && location?.lng != null) {
      this.riderLocations.set(riderId, {
        lat: Number(location.lat),
        lng: Number(location.lng),
        updatedAt: new Date().toISOString(),
      });
    }

    this.logger.log(`Rider ${riderId} is now online`);

    return {
      success: true,
      message: 'Rider marked as online',
      riderId,
    };
  }

  @SubscribeMessage('rider:offline')
  handleRiderOffline(
    @MessageBody() data: { riderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId } = data;

    this.riderSockets.delete(riderId);
    this.riderLocations.delete(riderId);
    client.leave(`rider:${riderId}`);

    this.logger.log(`Rider ${riderId} is now offline`);

    return {
      success: true,
      message: 'Rider marked as offline',
    };
  }

  @SubscribeMessage('customer:subscribe')
  handleCustomerSubscribe(
    @MessageBody() data: { customerId: string; bookingId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { customerId, bookingId } = data;

    this.customerSockets.set(customerId, client.id);
    client.join(`customer:${customerId}`);

    if (bookingId) {
      client.join(`booking:${bookingId}`);
    }

    this.logger.log(`Customer ${customerId} subscribed to matching updates`);

    return {
      success: true,
      message: 'Subscribed to matching updates',
    };
  }

  @SubscribeMessage('rider:location')
  handleRiderLocationUpdate(
    @MessageBody() data: { riderId: string; location: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, location } = data;
    if (location?.lat != null && location?.lng != null) {
      this.riderLocations.set(riderId, {
        lat: Number(location.lat),
        lng: Number(location.lng),
        updatedAt: new Date().toISOString(),
      });
      this.refreshSnapshotsForRider(riderId);
    }

    // Broadcast to matching service for nearby delivery matching
    this.server.emit('rider:location:update', {
      riderId,
      location,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // Emit booking request to specific rider
  emitBookingRequest(riderId: string, bookingData: any) {
    const socketId = this.riderSockets.get(riderId);

    if (socketId) {
      this.server.to(`rider:${riderId}`).emit('booking:request', {
        ...bookingData,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Booking request sent to rider ${riderId}`);
      return true;
    }

    this.logger.warn(`Rider ${riderId} is not online`);
    return false;
  }

  // Emit booking accepted to customer
  emitBookingAccepted(customerId: string, bookingData: any) {
    if (bookingData?.bookingId) {
      this.bookingSnapshots.delete(String(bookingData.bookingId));
    }
    const event = {
      ...bookingData,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('booking:accepted', event);
    this.emitDispatchSnapshot(
      { customerId, bookingId: bookingData.bookingId },
      {
        dispatchId: bookingData.bookingId,
        resourceType: 'booking',
        customerId,
        stage: 'assigned',
        candidateCount: bookingData?.rider ? 1 : 0,
        activeRiderId: bookingData?.rider?.user_id || null,
        candidates: bookingData?.rider
          ? [
              {
                riderId: bookingData.rider.user_id,
                name: bookingData.rider.name,
                vehicle: bookingData.rider.vehicle,
                phone: bookingData.rider.phone,
                rating: bookingData.rider.rating,
                etaMin: bookingData.rider.eta_min,
              },
            ]
          : [],
        message: 'A tasker has accepted the request.',
        updatedAt: event.timestamp,
      },
    );

    this.logger.log(
      `Booking accepted notification sent to customer ${customerId}`,
    );
  }

  // Emit booking rejected to customer
  emitBookingRejected(customerId: string, bookingId: string, reason?: string) {
    const event = {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('booking:rejected', event);

    this.logger.log(
      `Booking rejected notification sent to customer ${customerId}`,
    );
  }

  emitBookingProgress(customerId: string, payload: any) {
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('booking:progress', event);
    this.server
      .to(`booking:${payload.bookingId}`)
      .emit('booking:progress', event);
    this.emitDispatchSnapshot(
      { customerId, bookingId: payload.bookingId },
      {
        dispatchId: payload.bookingId,
        resourceType: 'booking',
        customerId,
        stage: 'in_transit',
        candidateCount: payload?.rider ? 1 : 0,
        activeRiderId: payload?.rider?.user_id || null,
        candidates: payload?.rider
          ? [
              {
                riderId: payload.rider.user_id,
                name: payload.rider.name,
                vehicle: payload.rider.vehicle,
                phone: payload.rider.phone,
                rating: payload.rider.rating,
                etaMin: payload.rider.eta_min,
              },
            ]
          : [],
        message: `Booking moved to ${String(payload.stage || 'progress').replace(/_/g, ' ')}.`,
        updatedAt: event.timestamp,
      },
    );
  }

  emitBookingCompleted(customerId: string, payload: any) {
    if (payload?.bookingId) {
      this.bookingSnapshots.delete(String(payload.bookingId));
    }
    const event = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('booking:completed', event);
    this.server
      .to(`booking:${payload.bookingId}`)
      .emit('booking:completed', event);
    this.emitDispatchSnapshot(
      { customerId, bookingId: payload.bookingId },
      {
        dispatchId: payload.bookingId,
        resourceType: 'booking',
        customerId,
        stage: 'completed',
        candidateCount: payload?.rider ? 1 : 0,
        activeRiderId: payload?.rider?.user_id || null,
        candidates: payload?.rider
          ? [
              {
                riderId: payload.rider.user_id,
                name: payload.rider.name,
                vehicle: payload.rider.vehicle,
                phone: payload.rider.phone,
                rating: payload.rider.rating,
                etaMin: payload.rider.eta_min,
              },
            ]
          : [],
        message: 'Booking completed.',
        updatedAt: event.timestamp,
      },
    );
  }

  emitBookingCancelled(customerId: string, bookingId: string, reason?: string) {
    this.bookingSnapshots.delete(String(bookingId));
    const payload = {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('booking:cancelled', payload);
    this.server.to(`booking:${bookingId}`).emit('booking:cancelled', payload);
    this.emitDispatchSnapshot(
      { customerId, bookingId },
      {
        dispatchId: bookingId,
        resourceType: 'booking',
        customerId,
        stage: 'cancelled',
        candidateCount: 0,
        activeRiderId: null,
        candidates: [],
        message: reason || 'Booking cancelled.',
        updatedAt: payload.timestamp,
      },
    );
  }

  // Emit matching in progress
  emitMatchingInProgress(customerId: string, bookingId: string) {
    this.server.to(`customer:${customerId}`).emit('matching:in_progress', {
      bookingId,
      message: 'Finding a rider for you...',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Matching in progress notification sent to customer ${customerId}`,
    );
  }

  emitMatchingSnapshot(payload: Omit<MatchingSnapshotPayload, 'timestamp'>) {
    const event: MatchingSnapshotPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.bookingSnapshots.set(String(payload.bookingId), event);
    const dispatchEvent: DispatchStatusDto = {
      dispatchId: payload.bookingId,
      resourceType: 'booking',
      customerId: payload.customerId,
      stage: payload.stage,
      candidateCount: payload.candidateCount,
      activeRiderId: payload.activeRiderId || null,
      candidates: payload.candidates,
      message: payload.message,
      updatedAt: event.timestamp,
    };
    this.server
      .to(`customer:${payload.customerId}`)
      .emit('matching:snapshot', event);
    this.server
      .to(`booking:${payload.bookingId}`)
      .emit('matching:snapshot', event);
    this.server
      .to(`customer:${payload.customerId}`)
      .emit('dispatch:snapshot', dispatchEvent);
    this.server
      .to(`booking:${payload.bookingId}`)
      .emit('dispatch:snapshot', dispatchEvent);
  }

  // Emit matching failed
  emitMatchingFailed(customerId: string, bookingId: string, reason: string) {
    this.bookingSnapshots.delete(String(bookingId));
    const payload = {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`customer:${customerId}`).emit('matching:failed', payload);
    this.emitDispatchSnapshot(
      { customerId, bookingId },
      {
        dispatchId: bookingId,
        resourceType: 'booking',
        customerId,
        stage: 'failed',
        candidateCount: 0,
        activeRiderId: null,
        candidates: [],
        message: reason,
        updatedAt: payload.timestamp,
      },
    );

    this.logger.log(
      `Matching failed notification sent to customer ${customerId}`,
    );
  }

  // Emit rider arrival
  emitRiderArrival(bookingId: string, location: any) {
    this.server.to(`booking:${bookingId}`).emit('rider:arrived', {
      bookingId,
      location,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Rider arrival notification sent for booking ${bookingId}`);
  }

  // Check if rider is online
  isRiderOnline(riderId: string): boolean {
    return this.riderSockets.has(riderId);
  }

  // Get online riders count
  getOnlineRidersCount(): number {
    return this.riderSockets.size;
  }

  // Get all online rider IDs
  getOnlineRiderIds(): string[] {
    return Array.from(this.riderSockets.keys());
  }

  getRiderLocation(riderId: string): RiderLocationSnapshot | null {
    return this.riderLocations.get(riderId) || null;
  }

  private refreshSnapshotsForRider(riderId: string) {
    for (const [bookingId, snapshot] of this.bookingSnapshots.entries()) {
      const candidateIndex = snapshot.candidates.findIndex(
        (candidate) => candidate.riderId === riderId,
      );
      if (candidateIndex < 0) {
        continue;
      }

      const latestLocation = this.getRiderLocation(riderId);
      const nextCandidates = snapshot.candidates.map((candidate, index) =>
        index === candidateIndex
          ? {
              ...candidate,
              ...(latestLocation ? { location: latestLocation } : {}),
            }
          : candidate,
      );

      const nextSnapshot: MatchingSnapshotPayload = {
        ...snapshot,
        candidates: nextCandidates,
        timestamp: new Date().toISOString(),
      };

      this.bookingSnapshots.set(bookingId, nextSnapshot);
      this.server
        .to(`booking:${bookingId}`)
        .emit('matching:snapshot', nextSnapshot);
      this.server
        .to(`customer:${snapshot.customerId}`)
        .emit('matching:snapshot', nextSnapshot);
      this.emitDispatchSnapshot(
        { customerId: snapshot.customerId, bookingId },
        {
          dispatchId: bookingId,
          resourceType: 'booking',
          customerId: snapshot.customerId,
          stage: snapshot.stage,
          candidateCount: snapshot.candidateCount,
          activeRiderId: snapshot.activeRiderId || null,
          candidates: nextCandidates,
          message: snapshot.message,
          updatedAt: nextSnapshot.timestamp,
        },
      );
    }
  }
}
