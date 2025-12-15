import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchingService } from '../../application/services/matching.service';
import {
  CreateBookingDto,
  EditBookingDto,
  CancelBookingDto,
  RespondToOfferDto,
  UpdateProgressDto,
  BookingResponseDto,
  CreateBookingResponseDto,
} from '../../application/dtos/booking.dto';
import { JwtAuthGuard } from '../../../modules/auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../shared/common/decorators/public.decorator';

@ApiTags('Matching & Booking')
@Controller('matching/bookings')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create booking and start matching' })
  @ApiResponse({
    status: 201,
    description: 'Booking created',
    type: CreateBookingResponseDto,
  })
  async createBooking(
    @Body() dto: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    return this.matchingService.createBooking(dto);
  }

  @Get(':bookingId')
  @Public()
  @ApiOperation({ summary: 'Get booking details' })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved',
    type: BookingResponseDto,
  })
  async getBooking(
    @Param('bookingId') bookingId: string,
  ): Promise<BookingResponseDto> {
    return this.matchingService.getBooking(bookingId);
  }

  @Patch(':bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit booking details' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated',
    type: BookingResponseDto,
  })
  async editBooking(
    @Param('bookingId') bookingId: string,
    @Body() dto: EditBookingDto,
  ): Promise<BookingResponseDto> {
    return this.matchingService.editBooking(bookingId, dto);
  }

  @Post(':bookingId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled',
    type: BookingResponseDto,
  })
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelBookingDto,
  ): Promise<BookingResponseDto> {
    return this.matchingService.cancelBooking(bookingId, dto);
  }

  @Post(':bookingId/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rider accept/decline offer' })
  @ApiResponse({
    status: 200,
    description: 'Response recorded',
    type: BookingResponseDto,
  })
  async respondToOffer(
    @Param('bookingId') bookingId: string,
    @Body() dto: RespondToOfferDto,
  ): Promise<BookingResponseDto> {
    return this.matchingService.respondToOffer(bookingId, dto);
  }

  @Post(':bookingId/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking progress' })
  @ApiResponse({
    status: 200,
    description: 'Progress updated',
    type: BookingResponseDto,
  })
  async updateProgress(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateProgressDto,
  ): Promise<BookingResponseDto> {
    return this.matchingService.updateProgress(bookingId, dto);
  }

  @Get(':bookingId/timers')
  @Public()
  @ApiOperation({ summary: 'Get wait timers' })
  @ApiResponse({ status: 200, description: 'Timers retrieved' })
  async getTimers(@Param('bookingId') bookingId: string): Promise<any> {
    return this.matchingService.getTimers(bookingId);
  }

  @Post(':bookingId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete booking with pricing/payment' })
  @ApiResponse({
    status: 200,
    description: 'Booking completed',
    type: BookingResponseDto,
  })
  async completeBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: any,
  ): Promise<BookingResponseDto> {
    return this.matchingService.completeBooking(
      bookingId,
      body.pricing,
      body.payment,
    );
  }
}
