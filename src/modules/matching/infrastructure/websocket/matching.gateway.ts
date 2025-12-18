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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to matching: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from matching: ${client.id}`);

    // Clean up rider sockets
    for (const [riderId, socketId] of this.riderSockets.entries()) {
      if (socketId === client.id) {
        this.riderSockets.delete(riderId);
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
    this.server.to(`customer:${customerId}`).emit('booking:accepted', {
      ...bookingData,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Booking accepted notification sent to customer ${customerId}`,
    );
  }

  // Emit booking rejected to customer
  emitBookingRejected(customerId: string, bookingId: string, reason?: string) {
    this.server.to(`customer:${customerId}`).emit('booking:rejected', {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Booking rejected notification sent to customer ${customerId}`,
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

  // Emit matching failed
  emitMatchingFailed(customerId: string, bookingId: string, reason: string) {
    this.server.to(`customer:${customerId}`).emit('matching:failed', {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    });

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
}
