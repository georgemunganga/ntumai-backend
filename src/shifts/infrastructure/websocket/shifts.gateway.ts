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
  namespace: '/shifts',
  cors: {
    origin: '*',
  },
})
export class ShiftsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ShiftsGateway.name);
  private activeRiders: Map<string, { socketId: string; location?: any }> =
    new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to shifts: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from shifts: ${client.id}`);

    // Mark rider as offline if they disconnect
    for (const [riderId, data] of this.activeRiders.entries()) {
      if (data.socketId === client.id) {
        this.activeRiders.delete(riderId);
        this.broadcastRiderOffline(riderId);
      }
    }
  }

  @SubscribeMessage('shift:start')
  handleShiftStart(
    @MessageBody() data: { riderId: string; shiftId: string; location?: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, shiftId, location } = data;

    this.activeRiders.set(riderId, { socketId: client.id, location });
    client.join(`rider:${riderId}`);
    client.join('active-riders');

    this.logger.log(`Rider ${riderId} started shift ${shiftId}`);

    // Broadcast to admin/dispatch
    this.server.to('dispatch').emit('shift:started', {
      riderId,
      shiftId,
      location,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Shift started' };
  }

  @SubscribeMessage('shift:end')
  handleShiftEnd(
    @MessageBody() data: { riderId: string; shiftId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, shiftId } = data;

    this.activeRiders.delete(riderId);
    client.leave(`rider:${riderId}`);
    client.leave('active-riders');

    this.logger.log(`Rider ${riderId} ended shift ${shiftId}`);

    // Broadcast to admin/dispatch
    this.server.to('dispatch').emit('shift:ended', {
      riderId,
      shiftId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Shift ended' };
  }

  @SubscribeMessage('shift:pause')
  handleShiftPause(
    @MessageBody() data: { riderId: string; shiftId: string; reason?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, shiftId, reason } = data;

    this.logger.log(`Rider ${riderId} paused shift ${shiftId}`);

    this.server.to('dispatch').emit('shift:paused', {
      riderId,
      shiftId,
      reason,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Shift paused' };
  }

  @SubscribeMessage('shift:resume')
  handleShiftResume(
    @MessageBody() data: { riderId: string; shiftId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, shiftId } = data;

    this.logger.log(`Rider ${riderId} resumed shift ${shiftId}`);

    this.server.to('dispatch').emit('shift:resumed', {
      riderId,
      shiftId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Shift resumed' };
  }

  @SubscribeMessage('location:update')
  handleLocationUpdate(
    @MessageBody() data: { riderId: string; location: any },
    @ConnectedSocket() client: Socket,
  ) {
    const { riderId, location } = data;

    const riderData = this.activeRiders.get(riderId);
    if (riderData) {
      riderData.location = location;
      this.activeRiders.set(riderId, riderData);
    }

    // Broadcast location to dispatch for heatmap
    this.server.to('dispatch').emit('rider:location', {
      riderId,
      location,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('dispatch:subscribe')
  handleDispatchSubscribe(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.join('dispatch');

    this.logger.log(`Dispatch client ${client.id} subscribed`);

    // Send current active riders
    const activeRiders = Array.from(this.activeRiders.entries()).map(
      ([riderId, data]) => ({
        riderId,
        location: data.location,
      }),
    );

    return {
      success: true,
      activeRiders,
      count: activeRiders.length,
    };
  }

  // Emit shift reminder
  emitShiftReminder(riderId: string, message: string) {
    this.server.to(`rider:${riderId}`).emit('shift:reminder', {
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Shift reminder sent to rider ${riderId}`);
  }

  // Emit shift alert
  emitShiftAlert(riderId: string, alert: any) {
    this.server.to(`rider:${riderId}`).emit('shift:alert', {
      ...alert,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Shift alert sent to rider ${riderId}`);
  }

  // Broadcast rider online status
  broadcastRiderOnline(riderId: string, location?: any) {
    this.server.to('dispatch').emit('rider:online', {
      riderId,
      location,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast rider offline status
  broadcastRiderOffline(riderId: string) {
    this.server.to('dispatch').emit('rider:offline', {
      riderId,
      timestamp: new Date().toISOString(),
    });
  }

  // Get active riders count
  getActiveRidersCount(): number {
    return this.activeRiders.size;
  }

  // Get active riders locations
  getActiveRidersLocations(): Array<{ riderId: string; location: any }> {
    return Array.from(this.activeRiders.entries()).map(([riderId, data]) => ({
      riderId,
      location: data.location,
    }));
  }

  // Broadcast to all active riders
  broadcastToActiveRiders(event: string, data: any) {
    this.server.to('active-riders').emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcast ${event} to all active riders`);
  }
}
