import { Injectable } from '@nestjs/common';
import { LocationRepository } from '../../infrastructure/repositories/location.repository';
import { LocationEntity } from '../../domain/entities/location.entity';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async updateTaskerLocation(taskerId: string, latitude: number, longitude: number): Promise<void> {
    await this.locationRepository.updateTaskerLocation(taskerId, latitude, longitude);
  }

  async saveLocation(data: Partial<LocationEntity>): Promise<LocationEntity> {
    const location = new LocationEntity(data);
    return this.locationRepository.save(location);
  }
}
