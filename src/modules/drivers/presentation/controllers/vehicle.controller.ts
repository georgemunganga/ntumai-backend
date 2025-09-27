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
import { VehicleService } from '../../application/services/vehicle.service';
import {
  AddVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  UpdateVehicleStatusDto,
  UpdateVehicleVerificationDto,
  UpdateVehicleMileageDto,
  AddVehicleMaintenanceDto,
  SearchVehiclesDto,
  PaginatedVehiclesResponseDto,
  VehicleMaintenanceHistoryResponseDto,
} from '../dtos';

@ApiTags('Vehicle Management')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Add a new vehicle' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle added successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid vehicle data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Vehicle with this license plate already exists',
  })
  async addVehicle(
    @Request() req: any,
    @Body() addVehicleDto: AddVehicleDto,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.id;
    return this.vehicleService.addVehicle(riderId, addVehicleDto);
  }

  @Get()
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get rider vehicles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles retrieved successfully',
    type: [VehicleResponseDto],
  })
  async getRiderVehicles(@Request() req: any): Promise<VehicleResponseDto[]> {
    const riderId = req.user.id;
    return this.vehicleService.getRiderVehicles(riderId);
  }

  @Get(':vehicleId')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle retrieved successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getVehicleById(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.vehicleService.getVehicleById(vehicleId, riderId);
  }

  @Put(':vehicleId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update vehicle information' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update vehicle owned by another rider',
  })
  async updateVehicle(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.id;
    return this.vehicleService.updateVehicle(vehicleId, riderId, updateVehicleDto);
  }

  @Delete(':vehicleId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Vehicle deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete vehicle owned by another rider',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicle(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.vehicleService.deleteVehicle(vehicleId, riderId);
  }

  @Put(':vehicleId/status')
  @Roles('DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Update vehicle status' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle status updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async updateVehicleStatus(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() updateStatusDto: UpdateVehicleStatusDto,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.vehicleService.updateVehicleStatus(vehicleId, updateStatusDto, riderId);
  }

  @Put(':vehicleId/verification')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Update vehicle verification status (Admin only)' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle verification updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateVehicleVerification(
    @Param('vehicleId') vehicleId: string,
    @Body() updateVerificationDto: UpdateVehicleVerificationDto,
  ): Promise<VehicleResponseDto> {
    return this.vehicleService.updateVehicleVerification(vehicleId, updateVerificationDto);
  }

  @Put(':vehicleId/mileage')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Update vehicle mileage' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle mileage updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid mileage value',
  })
  async updateVehicleMileage(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() updateMileageDto: UpdateVehicleMileageDto,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.id;
    return this.vehicleService.updateVehicleMileage(vehicleId, riderId, updateMileageDto);
  }

  @Post(':vehicleId/maintenance')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Add vehicle maintenance record' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Maintenance record added successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid maintenance data',
  })
  async addVehicleMaintenance(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() addMaintenanceDto: AddVehicleMaintenanceDto,
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.id;
    return this.vehicleService.addVehicleMaintenance(vehicleId, riderId, addMaintenanceDto);
  }

  @Get(':vehicleId/maintenance')
  @Roles('DRIVER', 'ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get vehicle maintenance history' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance history retrieved successfully',
    type: VehicleMaintenanceHistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async getVehicleMaintenanceHistory(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<VehicleMaintenanceHistoryResponseDto> {
    const riderId = req.user.role === 'DRIVER' ? req.user.id : undefined;
    return this.vehicleService.getVehicleMaintenanceHistory(vehicleId, riderId, { page, limit });
  }

  @Post(':vehicleId/photos')
  @Roles('DRIVER')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload vehicle photo' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle photo uploaded successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or vehicle not found',
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds limit',
  })
  async uploadVehiclePhoto(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @UploadedFile() photo: Express.Multer.File,
    @Body() metadata?: { description?: string; category?: string },
  ): Promise<VehicleResponseDto> {
    const riderId = req.user.id;
    return this.vehicleService.uploadVehiclePhoto(vehicleId, riderId, photo, metadata);
  }

  @Delete(':vehicleId/photos/:photoId')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Delete vehicle photo' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiParam({ name: 'photoId', description: 'Photo ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Vehicle photo deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle or photo not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehiclePhoto(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Param('photoId') photoId: string,
  ): Promise<void> {
    const riderId = req.user.id;
    return this.vehicleService.deleteVehiclePhoto(vehicleId, riderId, photoId);
  }

  @Get('search/all')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Search vehicles (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles retrieved successfully',
    type: PaginatedVehiclesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async searchVehicles(
    @Query() searchVehiclesDto: SearchVehiclesDto,
  ): Promise<PaginatedVehiclesResponseDto> {
    return this.vehicleService.searchVehicles(searchVehiclesDto);
  }

  @Get('statistics/overview')
  @Roles('ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Get vehicle statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getVehicleStatistics(): Promise<any> {
    return this.vehicleService.getVehicleStatistics();
  }

  @Get('maintenance/due')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get vehicles with due maintenance' })
  @ApiQuery({ name: 'daysAhead', description: 'Days ahead to check for due maintenance', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles with due maintenance retrieved successfully',
    type: [VehicleResponseDto],
  })
  async getVehiclesWithDueMaintenance(
    @Request() req: any,
    @Query('daysAhead') daysAhead: number = 30,
  ): Promise<VehicleResponseDto[]> {
    const riderId = req.user.id;
    return this.vehicleService.getVehiclesWithDueMaintenance(riderId, daysAhead);
  }

  @Get('insurance/expiring')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get vehicles with expiring insurance' })
  @ApiQuery({ name: 'daysAhead', description: 'Days ahead to check for expiring insurance', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicles with expiring insurance retrieved successfully',
    type: [VehicleResponseDto],
  })
  async getVehiclesWithExpiringInsurance(
    @Request() req: any,
    @Query('daysAhead') daysAhead: number = 30,
  ): Promise<VehicleResponseDto[]> {
    const riderId = req.user.id;
    return this.vehicleService.getVehiclesWithExpiringInsurance(riderId, daysAhead);
  }

  @Post('bulk-update-status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk update vehicle status (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle statuses updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk update data',
  })
  async bulkUpdateVehicleStatus(
    @Body() bulkUpdateData: {
      vehicleIds: string[];
      status: string;
      reason?: string;
    },
  ): Promise<{ updated: number; failed: string[] }> {
    return this.vehicleService.bulkUpdateVehicleStatus(bulkUpdateData);
  }

  @Get('export/data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export vehicle data (Admin only)' })
  @ApiQuery({ name: 'format', description: 'Export format (csv, xlsx)', required: false })
  @ApiQuery({ name: 'filters', description: 'Export filters', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle data exported successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async exportVehicles(
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Query('filters') filters?: string,
  ): Promise<any> {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.vehicleService.exportVehicles(format, parsedFilters);
  }
}