import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WsResponse } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LocationService } from './application/services/location.service';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { TaskerLocationUpdateDto } from './interfaces/dtos/location.dto';

@WebSocketGateway({
  namespace: 'location',
  cors: {
    origin: '*',
  },
})
export class RealTimeLocationGateway {
  private readonly logger = new Logger(RealTimeLocationGateway.name);

  constructor(
    private readonly locationService: LocationService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  @SubscribeMessage('tasker.location.update')
  async handleLocationUpdate(
    @MessageBody() data: TaskerLocationUpdateDto,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<any>> {
    // 1. Validate the incoming data (simplified for this phase)
    if (!data.taskerId || !data.latitude || !data.longitude) {
      this.logger.warn(`Invalid location update received from ${client.id}`);
      return { event: 'error', data: { message: 'Invalid payload' } };
    }

    this.logger.debug(`Received location update for Tasker ${data.taskerId}: (${data.latitude}, ${data.longitude})`);

    // 2. Publish the event to Kafka for processing by the Go Matching Engine and NestJS persistence consumer
    try {
      await this.kafkaProducerService.produce('tasker.location.updated', {
        key: data.taskerId,
        value: JSON.stringify(data),
      });
      
      // 3. Respond to the client (optional, but good practice)
      return { event: 'tasker.location.ack', data: { success: true, timestamp: new Date().toISOString() } };
    } catch (error) {
      this.logger.error(`Failed to produce location event for Tasker ${data.taskerId}: ${error.message}`);
      return { event: 'error', data: { message: 'Server error during processing' } };
    }
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Authentication logic would go here (e.g., checking JWT from handshake)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
