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
  namespace: '/deliveries',
  cors: {
    origin: '*',
  },
})
export class DeliveriesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeliveriesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to deliveries: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from deliveries: ${client.id}`);
  }

  @SubscribeMessage('subscribe:delivery')
  handleSubscribeDelivery(
    @MessageBody() data: { deliveryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deliveryId } = data;
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
    client.leave(`delivery:${deliveryId}`);

    this.logger.log(
      `Client ${client.id} unsubscribed from delivery ${deliveryId}`,
    );

    return {
      success: true,
      message: `Unsubscribed from delivery ${deliveryId}`,
    };
  }

  // Emit delivery created
  emitDeliveryCreated(userId: string, delivery: any) {
    this.server.to(`user:${userId}`).emit('delivery:created', {
      delivery,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery created notification sent to user ${userId}`);
  }

  // Emit delivery status update
  emitDeliveryStatusUpdate(deliveryId: string, status: string, details?: any) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:status_update', {
      deliveryId,
      status,
      details,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery ${deliveryId} status updated to ${status}`);
  }

  // Emit rider assigned
  emitRiderAssigned(deliveryId: string, riderInfo: any) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:rider_assigned', {
      deliveryId,
      rider: riderInfo,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Rider assigned to delivery ${deliveryId}`);
  }

  // Emit pickup started
  emitPickupStarted(deliveryId: string, location: any) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:pickup_started', {
      deliveryId,
      location,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Pickup started for delivery ${deliveryId}`);
  }

  // Emit pickup completed
  emitPickupCompleted(deliveryId: string, location: any, attachments?: any[]) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:pickup_completed', {
      deliveryId,
      location,
      attachments,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Pickup completed for delivery ${deliveryId}`);
  }

  // Emit in transit
  emitInTransit(deliveryId: string, currentStop: number, totalStops: number) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:in_transit', {
      deliveryId,
      currentStop,
      totalStops,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Delivery ${deliveryId} in transit (stop ${currentStop}/${totalStops})`,
    );
  }

  // Emit arriving at dropoff
  emitArrivingAtDropoff(deliveryId: string, stopIndex: number, eta: string) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:arriving', {
      deliveryId,
      stopIndex,
      eta,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery ${deliveryId} arriving at stop ${stopIndex}`);
  }

  // Emit dropoff completed
  emitDropoffCompleted(
    deliveryId: string,
    stopIndex: number,
    attachments?: any[],
  ) {
    this.server
      .to(`delivery:${deliveryId}`)
      .emit('delivery:dropoff_completed', {
        deliveryId,
        stopIndex,
        attachments,
        timestamp: new Date().toISOString(),
      });

    this.logger.log(
      `Dropoff completed for delivery ${deliveryId} stop ${stopIndex}`,
    );
  }

  // Emit delivery completed
  emitDeliveryCompleted(deliveryId: string, summary: any) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:completed', {
      deliveryId,
      summary,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery ${deliveryId} completed`);
  }

  // Emit delivery cancelled
  emitDeliveryCancelled(
    deliveryId: string,
    reason: string,
    cancelledBy: string,
  ) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:cancelled', {
      deliveryId,
      reason,
      cancelledBy,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Delivery ${deliveryId} cancelled by ${cancelledBy}`);
  }

  // Emit payment status update
  emitPaymentStatusUpdate(deliveryId: string, paymentStatus: string) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:payment_update', {
      deliveryId,
      paymentStatus,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Payment status updated for delivery ${deliveryId}: ${paymentStatus}`,
    );
  }

  // Emit ETA update
  emitEtaUpdate(deliveryId: string, eta: string, stopIndex?: number) {
    this.server.to(`delivery:${deliveryId}`).emit('delivery:eta_update', {
      deliveryId,
      eta,
      stopIndex,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`ETA updated for delivery ${deliveryId}`);
  }
}
