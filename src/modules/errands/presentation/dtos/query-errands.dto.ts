import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsBoolean,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriorityEnum } from './create-errand.dto';
import { ErrandStatusEnum } from './update-errand.dto';

export enum SortFieldEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRICE = 'price',
  PRIORITY = 'priority',
  DEADLINE = 'deadline',
  TITLE = 'title',
}

export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryErrandsDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ErrandStatusEnum,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ErrandStatusEnum, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  status?: ErrandStatusEnum[];

  @ApiPropertyOptional({ 
    description: 'Filter by priority',
    enum: PriorityEnum,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PriorityEnum, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  priority?: PriorityEnum[];

  @ApiPropertyOptional({ 
    description: 'Filter by category',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  category?: string[];

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned driver ID' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID (creator or assigned)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter (in cents)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter (in cents)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Start date filter (ISO 8601 format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO 8601 format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: SortFieldEnum,
    default: SortFieldEnum.CREATED_AT
  })
  @IsOptional()
  @IsEnum(SortFieldEnum)
  sortBy?: SortFieldEnum = SortFieldEnum.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort direction',
    enum: SortDirectionEnum,
    default: SortDirectionEnum.DESC
  })
  @IsOptional()
  @IsEnum(SortDirectionEnum)
  sortOrder?: SortDirectionEnum = SortDirectionEnum.DESC;

  @ApiPropertyOptional({ description: 'Search query for title, description, or category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter for available errands only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  availableOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter for overdue errands only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter for errands requiring attention' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requiresAttention?: boolean;

  // Location-based filtering
  @ApiPropertyOptional({ description: 'Latitude for location-based search', minimum: -90, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for location-based search', minimum: -180, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', minimum: 0.1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius?: number;
}