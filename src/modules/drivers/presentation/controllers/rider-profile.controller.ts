import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { RiderProfileService } from '../../application/services/rider-profile.service';
import {
  CreateRiderProfileDto,
  UpdateRiderProfileDto,
  RiderProfileResponseDto,
  UpdateRiderStatusDto,
  UpdateRiderLocationDto,
  UpdateRiderAvailabilityDto,
  UploadDocumentDto,
  VerifyDocumentDto,
  SearchRidersDto,
  PaginatedRidersResponseDto,
} from '../dtos';

@ApiTags('Rider Profile')
@Controller('riders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RiderProfileController {
  constructor(private readonly riderProfileService: RiderProfileService) {}

  @Post('profile')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Create rider profile' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rider profile created successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Rider profile already exists',
  })
  async createProfile(
    @Request() req: any,
    @Body() createRiderProfileDto: CreateRiderProfileDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.createProfile(riderId, createRiderProfileDto);
  }

  @Get('profile')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current rider profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider profile retrieved successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  async getProfile(@Request() req: any): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.getProfile(riderId);
  }

  @Get('profile/:riderId')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get rider profile by ID (Admin only)' })
  @ApiParam({ name: 'riderId', description: 'Rider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider profile retrieved successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getProfileById(
    @Param('riderId') riderId: string,
  ): Promise<RiderProfileResponseDto> {
    return this.riderProfileService.getProfile(riderId);
  }

  @Put('profile')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update rider profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider profile updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateProfile(
    @Request() req: any,
    @Body() updateRiderProfileDto: UpdateRiderProfileDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.updateProfile(riderId, updateRiderProfileDto);
  }

  @Delete('profile')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete rider profile' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Rider profile deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@Request() req: any): Promise<void> {
    const riderId = req.user.id;
    return this.riderProfileService.deleteProfile(riderId);
  }

  @Put('status')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update rider status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider status updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async updateStatus(
    @Request() req: any,
    @Body() updateStatusDto: UpdateRiderStatusDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.updateStatus(riderId, updateStatusDto);
  }

  @Put('status/:riderId')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update rider status (Admin only)' })
  @ApiParam({ name: 'riderId', description: 'Rider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider status updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateStatusById(
    @Param('riderId') riderId: string,
    @Body() updateStatusDto: UpdateRiderStatusDto,
  ): Promise<RiderProfileResponseDto> {
    return this.riderProfileService.updateStatus(riderId, updateStatusDto);
  }

  @Put('location')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update rider location' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider location updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid location data',
  })
  async updateLocation(
    @Request() req: any,
    @Body() updateLocationDto: UpdateRiderLocationDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.updateLocation(riderId, updateLocationDto);
  }

  @Put('availability')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update rider availability' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider availability updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rider profile not found',
  })
  async updateAvailability(
    @Request() req: any,
    @Body() updateAvailabilityDto: UpdateRiderAvailabilityDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.updateAvailability(riderId, updateAvailabilityDto);
  }

  @Post('documents')
  @Roles('DRIVER')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload rider document' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or document data',
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds limit',
  })
  async uploadDocument(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
  ): Promise<RiderProfileResponseDto> {
    const riderId = req.user.id;
    return this.riderProfileService.uploadDocument(riderId, file, uploadDocumentDto);
  }

  @Put('documents/:documentId/verify')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Verify rider document (Admin only)' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document verification updated successfully',
    type: RiderProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() verifyDocumentDto: VerifyDocumentDto,
  ): Promise<RiderProfileResponseDto> {
    return this.riderProfileService.verifyDocument(documentId, verifyDocumentDto);
  }

  @Delete('documents/:documentId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete rider document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete verified document',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(
    @Request() req: any,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.riderProfileService.deleteDocument(riderId, documentId);
  }

  @Get('search')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search riders (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Riders retrieved successfully',
    type: PaginatedRidersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchRiders(
    @Query() searchRidersDto: SearchRidersDto,
  ): Promise<PaginatedRidersResponseDto> {
    return this.riderProfileService.searchRiders(searchRidersDto);
  }

  @Get('nearby')
  @Roles('ADMIN', 'SUPPORT', 'VENDOR')
  @ApiOperation({ summary: 'Find nearby available riders' })
  @ApiQuery({ name: 'latitude', description: 'Latitude coordinate' })
  @ApiQuery({ name: 'longitude', description: 'Longitude coordinate' })
  @ApiQuery({ name: 'radius', description: 'Search radius in kilometers', required: false })
  @ApiQuery({ name: 'limit', description: 'Maximum number of riders to return', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearby riders retrieved successfully',
    type: [RiderProfileResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid location coordinates',
  })
  async findNearbyRiders(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ): Promise<RiderProfileResponseDto[]> {
    return this.riderProfileService.findNearbyRiders({
      latitude,
      longitude,
      radius: radius || 10,
      limit: limit || 20,
    });
  }

  @Get('statistics')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get rider statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getRiderStatistics(): Promise<any> {
    return this.riderProfileService.getRiderStatistics();
  }

  @Post('bulk-update-status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk update rider status (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider statuses updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk update data',
  })
  async bulkUpdateStatus(
    @Body() bulkUpdateData: {
      riderIds: string[];
      status: string;
      reason?: string;
    },
  ): Promise<{ updated: number; failed: string[] }> {
    return this.riderProfileService.bulkUpdateStatus(bulkUpdateData);
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export rider data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportRiders(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.riderProfileService.exportRiders(format, parsedFilters);
  }
}