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
  namespace: '/tracking',
  cors: {
    origin: '*',
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private activeSubscriptions: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to tracking: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tracking: ${client.id}`);

    // Clean up subscriptions
    this.activeSubscriptions.forEach((clients, deliveryId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.activeSubscriptions.delete(deliveryId);
      }
    });
  }

  @SubscribeMessage('subscribe:delivery')
  handleSubscribeDelivery(
    @MessageBody() data: { deliveryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deliveryId } = data;

    if (!this.activeSubscriptions.has(deliveryId)) {
      this.activeSubscriptions.set(deliveryId, new Set());
    }

    this.activeSubscriptions.get(deliveryId)!.add(client.id);
    client.join(`delivery:${deliveryId}`);

    this.logger.log(`Client ${client.id} subscribed to delivery ${deliveryId}`);

    return { success: true, message: `Subscribed to delivery ${deliveryId}` };
  }

  @SubscribeMessage('unsubscribe:delivery')
  handleUnsubscribeDelivery(
    @MessageBody() data: { deliveryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deliveryId } = data;

    if (this.activeSubscriptions.has(deliveryId)) {
      this.activeSubscriptions.get(deliveryId)!.delete(client.id);
    }

    client.leave(`delivery:${deliveryId}`);

    this.logger.log(
      `Client ${client.id} unsubscribed from delivery ${deliveryId}`,
    );

    return {
      success: true,
      message: `Unsubscribed from delivery ${deliveryId}`,
    };
  }

  @SubscribeMessage('subscribe:booking')
  handleSubscribeBooking(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { bookingId } = data;
    client.join(`booking:${bookingId}`);

    this.logger.log(`Client ${client.id} subscribed to booking ${bookingId}`);

    return { success: true, message: `Subscribed to booking ${bookingId}` };
  }

  @SubscribeMessage('unsubscribe:booking')
  handleUnsubscribeBooking(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { bookingId } = data;
    client.leave(`booking:${bookingId}`);

    this.logger.log(
      `Client ${client.id} unsubscribed from booking ${bookingId}`,
    );

    return { success: true, message: `Unsubscribed from booking ${bookingId}` };
  }

  // Emit location update to all subscribers
  emitLocationUpdate(deliveryId: string, location: any) {
    this.server.to(`delivery:${deliveryId}`).emit('location:update', {
      deliveryId,
      location,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Location update emitted for delivery ${deliveryId}`);
  }

  // Emit status update
  emitStatusUpdate(deliveryId: string, status: string, eventType: string) {
    this.server.to(`delivery:${deliveryId}`).emit('status:update', {
      deliveryId,
      status,
      eventType,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `Status update emitted for delivery ${deliveryId}: ${eventType}`,
    );
  }

  // Emit booking update
  emitBookingUpdate(bookingId: string, data: any) {
    this.server.to(`booking:${bookingId}`).emit('booking:update', {
      bookingId,
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Booking update emitted for ${bookingId}`);
  }

  // Emit ETA update
  emitEtaUpdate(deliveryId: string, eta: string) {
    this.server.to(`delivery:${deliveryId}`).emit('eta:update', {
      deliveryId,
      eta,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`ETA update emitted for delivery ${deliveryId}`);
  }

  // Get active subscribers count
  getSubscribersCount(deliveryId: string): number {
    return this.activeSubscriptions.get(deliveryId)?.size || 0;
  }
}
