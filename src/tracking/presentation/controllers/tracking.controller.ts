import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrackingService } from '../../application/services/tracking.service';
import {
  CreateTrackingEventDto,
  TrackingEventResponseDto,
  TrackingTimelineDto,
} from '../../application/dtos/tracking.dto';
import { Public } from '../../../shared/common/decorators/public.decorator';

@ApiTags('Tracking')
@Controller('tracking')
@Public()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('events')
  @ApiOperation({ summary: 'Create tracking event' })
  @ApiResponse({
    status: 201,
    description: 'Event created',
    type: TrackingEventResponseDto,
  })
  async createEvent(
    @Body() dto: CreateTrackingEventDto,
  ): Promise<TrackingEventResponseDto> {
    return this.trackingService.createEvent(dto);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get tracking timeline by booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Timeline retrieved',
    type: TrackingTimelineDto,
  })
  async getTrackingByBooking(
    @Param('bookingId') bookingId: string,
  ): Promise<TrackingTimelineDto> {
    return this.trackingService.getTrackingByBooking(bookingId);
  }

  @Get('delivery/:deliveryId')
  @ApiOperation({ summary: 'Get tracking timeline by delivery ID' })
  @ApiResponse({
    status: 200,
    description: 'Timeline retrieved',
    type: TrackingTimelineDto,
  })
  async getTrackingByDelivery(
    @Param('deliveryId') deliveryId: string,
  ): Promise<TrackingTimelineDto> {
    return this.trackingService.getTrackingByDelivery(deliveryId);
  }

  @Get('booking/:bookingId/location')
  @ApiOperation({ summary: 'Get current location for booking' })
  @ApiResponse({ status: 200, description: 'Current location retrieved' })
  async getCurrentLocation(
    @Param('bookingId') bookingId: string,
  ): Promise<any> {
    return this.trackingService.getCurrentLocation(bookingId);
  }
}
