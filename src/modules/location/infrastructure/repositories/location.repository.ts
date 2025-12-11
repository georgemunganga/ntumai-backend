import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { LocationEntity } from '../../domain/entities/location.entity';

@Injectable()
export class LocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateTaskerLocation(taskerId: string, latitude: number, longitude: number): Promise<void> {
    // Upsert the tasker's current location for real-time tracking
    // Assuming a TaskerLocation model exists in the Prisma schema
    await this.prisma.taskerLocation.upsert({
      where: { taskerId },
      update: { latitude, longitude },
      create: { taskerId, latitude, longitude },
    });
  }

  async save(location: LocationEntity): Promise<LocationEntity> {
    // This is a placeholder. The Location model is not in the schema.
    return location;
  }
}
