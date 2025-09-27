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
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { ErrandManagementService } from '../../application/services/errand-management.service';
import {
  CreateErrandDto,
  UpdateErrandDto,
  AssignErrandDto,
  AddProofDto,
  QueryErrandsDto,
  ErrandResponseDto,
  PaginatedResponseDto,
  ErrandStatisticsResponseDto,
} from '../dtos';

@ApiTags('Errands')
@Controller('errands')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ErrandsController {
  constructor(
    private readonly errandManagementService: ErrandManagementService,
  ) {}

  @Post()
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new errand' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Errand created successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createErrand(
    @Body() createErrandDto: CreateErrandDto,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    const errand = await this.errandManagementService.createErrand({
      ...createErrandDto,
      createdBy: req.user.id,
    });
    return errand;
  }

  @Get()
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get list of errands with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errands retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getErrands(
    @Query() queryDto: QueryErrandsDto,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<ErrandResponseDto>> {
    return await this.errandManagementService.getErrands({
      ...queryDto,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
    });
  }

  @Get('available')
  @Roles('DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get available errands for drivers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available errands retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getAvailableErrands(
    @Query() queryDto: QueryErrandsDto,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<ErrandResponseDto>> {
    return await this.errandManagementService.getAvailableErrands({
      ...queryDto,
      driverId: req.user.id,
    });
  }

  @Get('my-errands')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get errands created by or assigned to the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User errands retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getMyErrands(
    @Query() queryDto: QueryErrandsDto,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<ErrandResponseDto>> {
    return await this.errandManagementService.getErrandsByUser({
      ...queryDto,
      userId: req.user.id,
      userRole: req.user.role,
    });
  }

  @Get('statistics')
  @Roles('ADMIN', 'CUSTOMER', 'DRIVER')
  @ApiOperation({ summary: 'Get errand statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: ErrandStatisticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getStatistics(
    @Request() req: any,
  ): Promise<ErrandStatisticsResponseDto> {
    return await this.errandManagementService.getStatistics({
      userId: req.user.role === 'ADMIN' ? undefined : req.user.id,
      userRole: req.user.role,
    });
  }

  @Get(':id')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get errand by ID' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand retrieved successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getErrandById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.getErrandById({
      id,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
    });
  }

  @Put(':id')
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Update errand' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand updated successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or errand cannot be updated',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateErrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateErrandDto: UpdateErrandDto,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.updateErrand({
      id,
      ...updateErrandDto,
      updatedBy: req.user.id,
      updaterRole: req.user.role,
    });
  }

  @Post(':id/assign')
  @Roles('ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Assign errand to a driver' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand assigned successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Errand cannot be assigned or driver not available',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async assignErrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignErrandDto: AssignErrandDto,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.assignErrand({
      errandId: id,
      driverId: req.user.role === 'DRIVER' ? req.user.id : assignErrandDto.driverId,
      assignedBy: req.user.id,
      estimatedArrivalTime: assignErrandDto.estimatedArrivalTime,
      notes: assignErrandDto.notes,
    });
  }

  @Post(':id/start')
  @Roles('DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Start errand execution' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand started successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Errand cannot be started',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async startErrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.startErrand({
      errandId: id,
      driverId: req.user.id,
    });
  }

  @Post(':id/complete')
  @Roles('DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Complete errand' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand completed successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Errand cannot be completed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async completeErrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { completionNotes?: string },
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.completeErrand({
      errandId: id,
      driverId: req.user.id,
      completionNotes: body.completionNotes,
    });
  }

  @Post(':id/cancel')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Cancel errand' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand cancelled successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Errand cannot be cancelled',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async cancelErrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { cancellationReason?: string },
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.cancelErrand({
      errandId: id,
      cancelledBy: req.user.id,
      cancellationReason: body.cancellationReason,
    });
  }

  @Post(':id/proofs')
  @Roles('DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Add proof to errand' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Proof added successfully',
    type: ErrandResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid proof data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async addProof(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addProofDto: AddProofDto,
    @Request() req: any,
  ): Promise<ErrandResponseDto> {
    return await this.errandManagementService.addProof({
      errandId: id,
      uploadedBy: req.user.id,
      ...addProofDto,
    });
  }

  @Get(':id/history')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get errand history' })
  @ApiParam({ name: 'id', description: 'Errand ID', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Errand history retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Errand not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getErrandHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req: any,
  ) {
    // This would be implemented in the service
    // For now, return a placeholder response
    return {
      data: [],
      total: 0,
      page: page || 1,
      limit: limit || 10,
      totalPages: 0,
    };
  }
}