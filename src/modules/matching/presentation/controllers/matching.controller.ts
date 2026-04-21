import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
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
  EstimateBookingDto,
  EditBookingDto,
  CancelBookingDto,
  RespondToOfferDto,
  UpdateProgressDto,
  BookingResponseDto,
  CreateBookingResponseDto,
} from '../../application/dtos/booking.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../../shared/common/decorators/public.decorator';

@ApiTags('Matching & Booking')
@Controller('matching/bookings')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('rider/offers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List booking offers for the authenticated rider' })
  @ApiResponse({
    status: 200,
    description: 'Rider booking offers retrieved',
  })
  async listRiderOffers(@Request() req: any) {
    return {
      bookings: await this.matchingService.listRiderOffers(req.user.userId),
    };
  }

  @Get('rider/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active bookings for the authenticated rider' })
  @ApiResponse({
    status: 200,
    description: 'Rider active bookings retrieved',
  })
  async listRiderActive(@Request() req: any) {
    return {
      bookings: await this.matchingService.listRiderActiveBookings(
        req.user.userId,
      ),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bookings for the authenticated customer' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved',
  })
  async listBookings(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchingService.listCustomerBookings(
      req.user.userId,
      status,
      Number(page || 1),
      Number(limit || 20),
    );
  }

  @Post('config/estimate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estimate booking or errand service pricing' })
  @ApiResponse({
    status: 200,
    description: 'Booking estimate calculated',
  })
  async estimateBooking(@Body() dto: EstimateBookingDto) {
    return this.matchingService.estimateBooking(dto);
  }

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

  @Get(':bookingId/dispatch-status')
  @Public()
  @ApiOperation({ summary: 'Get shared dispatch status for a booking' })
  @ApiResponse({
    status: 200,
    description: 'Shared dispatch status retrieved',
  })
  async getDispatchStatus(@Param('bookingId') bookingId: string) {
    return this.matchingService.getDispatchStatus(bookingId);
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

  @Post(':bookingId/rate-customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rider rates customer after completed task' })
  @ApiResponse({
    status: 200,
    description: 'Customer rating submitted',
  })
  async rateCustomer(
    @Param('bookingId') bookingId: string,
    @Body() body: { rating: number; comment?: string },
    @Request() req: any,
  ) {
    return {
      success: true,
      data: await this.matchingService.rateCustomer(
        bookingId,
        req.user.userId,
        body,
      ),
    };
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
