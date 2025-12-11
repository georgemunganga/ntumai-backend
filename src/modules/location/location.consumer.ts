import { Controller, Logger } from '@nestjs/common';
import { EventPattern, KafkaContext, Payload, Ctx } from '@nestjs/microservices';
import { LocationService } from './application/services/location.service';
import { TaskerLocationUpdateDto } from './interfaces/dtos/location.dto';

@Controller()
export class LocationConsumer {
  private readonly logger = new Logger(LocationConsumer.name);

  constructor(private readonly locationService: LocationService) {}

  @EventPattern('tasker.location.updated')
  async handleLocationUpdate(
    @Payload() data: TaskerLocationUpdateDto,
    @Ctx() context: KafkaContext,
  ) {
    const originalMessage = context.getMessage();
    this.logger.debug(`Received location event for Tasker ${data.taskerId} from Kafka. Offset: ${originalMessage.offset}`);

    try {
      // 1. Persist the location update to the database for historical tracking
      await this.locationService.updateTaskerLocation(data.taskerId, data.latitude, data.longitude);
      this.logger.log(`Successfully persisted location for Tasker ${data.taskerId}`);
    } catch (error) {
      this.logger.error(`Failed to persist location for Tasker ${data.taskerId}: ${error.message}`, error.stack);
      // Depending on business logic, we might throw an error here to prevent committing the offset,
      // but for location updates, it's often better to log and continue.
    }
  }
}
