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
import { ErrandTemplateService } from '../../application/services/errand-template.service';
import {
  CreateErrandTemplateDto,
  UpdateErrandTemplateDto,
  QueryErrandTemplatesDto,
  ErrandTemplateResponseDto,
  PaginatedResponseDto,
  TemplateStatisticsResponseDto,
} from '../dtos';

@ApiTags('Errand Templates')
@Controller('errand-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ErrandTemplatesController {
  constructor(
    private readonly errandTemplateService: ErrandTemplateService,
  ) {}

  @Post()
  @Roles('ADMIN', 'CUSTOMER')
  @ApiOperation({ summary: 'Create a new errand template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async createTemplate(
    @Body() createTemplateDto: CreateErrandTemplateDto,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.createTemplate({
      ...createTemplateDto,
      createdBy: req.user.id,
    });
  }

  @Get()
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get list of errand templates with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Templates retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getTemplates(
    @Query() queryDto: QueryErrandTemplatesDto,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<ErrandTemplateResponseDto>> {
    return await this.errandTemplateService.getTemplates({
      ...queryDto,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
    });
  }

  @Get('public')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get public errand templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public templates retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getPublicTemplates(
    @Query() queryDto: QueryErrandTemplatesDto,
  ): Promise<PaginatedResponseDto<ErrandTemplateResponseDto>> {
    return await this.errandTemplateService.getPublicTemplates(queryDto);
  }

  @Get('categories')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get available template categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getCategories(): Promise<string[]> {
    return await this.errandTemplateService.getCategories();
  }

  @Get('tags')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get available template tags' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getTags(): Promise<string[]> {
    return await this.errandTemplateService.getTags();
  }

  @Get('most-used')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get most used errand templates' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of templates to return' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Most used templates retrieved successfully',
    type: [ErrandTemplateResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getMostUsedTemplates(
    @Query('limit') limit?: number,
  ): Promise<ErrandTemplateResponseDto[]> {
    return await this.errandTemplateService.getMostUsedTemplates({
      limit: limit || 10,
    });
  }

  @Get('recent')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get recently created errand templates' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of templates to return' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent templates retrieved successfully',
    type: [ErrandTemplateResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getRecentTemplates(
    @Query('limit') limit?: number,
  ): Promise<ErrandTemplateResponseDto[]> {
    return await this.errandTemplateService.getRecentTemplates({
      limit: limit || 10,
    });
  }

  @Get('search')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Search errand templates' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search query',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async searchTemplates(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req: any,
  ): Promise<PaginatedResponseDto<ErrandTemplateResponseDto>> {
    return await this.errandTemplateService.searchTemplates({
      query,
      page: page || 1,
      limit: limit || 10,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
    });
  }

  @Get('statistics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: TemplateStatisticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getStatistics(): Promise<TemplateStatisticsResponseDto> {
    return await this.errandTemplateService.getStatistics();
  }

  @Get(':id')
  @Roles('CUSTOMER', 'DRIVER', 'ADMIN')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async getTemplateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.getTemplateById({
      id,
      requestingUserId: req.user.id,
      requestingUserRole: req.user.role,
    });
  }

  @Put(':id')
  @Roles('ADMIN', 'CUSTOMER')
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTemplateDto: UpdateErrandTemplateDto,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.updateTemplate({
      id,
      ...updateTemplateDto,
      updatedBy: req.user.id,
      updaterRole: req.user.role,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'CUSTOMER')
  @ApiOperation({ summary: 'Delete template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    await this.errandTemplateService.deleteTemplate({
      id,
      deletedBy: req.user.id,
      deleterRole: req.user.role,
    });
  }

  @Post(':id/activate')
  @Roles('ADMIN', 'CUSTOMER')
  @ApiOperation({ summary: 'Activate template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template activated successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async activateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.activateTemplate({
      id,
      activatedBy: req.user.id,
      activatorRole: req.user.role,
    });
  }

  @Post(':id/deactivate')
  @Roles('ADMIN', 'CUSTOMER')
  @ApiOperation({ summary: 'Deactivate template' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template deactivated successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async deactivateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.deactivateTemplate({
      id,
      deactivatedBy: req.user.id,
      deactivatorRole: req.user.role,
    });
  }

  @Post(':id/use')
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Use template to create an errand' })
  @ApiParam({ name: 'id', description: 'Template ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template usage recorded successfully',
    type: ErrandTemplateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  async useTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ErrandTemplateResponseDto> {
    return await this.errandTemplateService.useTemplate({
      id,
      usedBy: req.user.id,
    });
  }
}