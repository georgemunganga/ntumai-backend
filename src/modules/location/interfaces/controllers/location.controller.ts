import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { LocationService } from '../../application/services/location.service';
import { CreateLocationDto } from '../dtos/location.dto';

@Controller('api/v1/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  async saveLocation(@Body() createLocationDto: CreateLocationDto) {
    return this.locationService.saveLocation(createLocationDto);
  }
}
