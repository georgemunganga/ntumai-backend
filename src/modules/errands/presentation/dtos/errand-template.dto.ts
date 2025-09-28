import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsBoolean,
  Min,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto, PriorityEnum } from './create-errand.dto';
import { SortFieldEnum, SortDirectionEnum } from './query-errands.dto';

export class CreateErrandTemplateDto {
  @ApiProperty({ description: 'Name of the errand template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the errand template' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Category of the errand template' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ 
    description: 'Tags for the template',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Default requirements for errands created from this template',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ 
    description: 'Default pickup location',
    type: LocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  defaultPickupLocation?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Default dropoff location',
    type: LocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  defaultDropoffLocation?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Default price in cents',
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Default priority level',
    enum: PriorityEnum,
    default: PriorityEnum.MEDIUM
  })
  @IsOptional()
  @IsEnum(PriorityEnum)
  defaultPriority?: PriorityEnum = PriorityEnum.MEDIUM;

  @ApiPropertyOptional({ 
    description: 'Estimated duration in minutes',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({ 
    description: 'Whether the template is public',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}

export class UpdateErrandTemplateDto {
  @ApiPropertyOptional({ description: 'Name of the errand template' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the errand template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category of the errand template' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Tags for the template',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Default requirements for errands created from this template',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ 
    description: 'Default pickup location',
    type: LocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  defaultPickupLocation?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Default dropoff location',
    type: LocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  defaultDropoffLocation?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Default price in cents',
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @ApiPropertyOptional({ 
    description: 'Default priority level',
    enum: PriorityEnum
  })
  @IsOptional()
  @IsEnum(PriorityEnum)
  defaultPriority?: PriorityEnum;

  @ApiPropertyOptional({ 
    description: 'Estimated duration in minutes',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Whether the template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Whether the template is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export enum TemplateSortFieldEnum {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  USAGE_COUNT = 'usageCount',
  LAST_USED_AT = 'lastUsedAt',
  DEFAULT_PRICE = 'defaultPrice',
}

export class QueryErrandTemplatesDto {
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

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by public status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ 
    description: 'Filter by category',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  category?: string[];

  @ApiPropertyOptional({ 
    description: 'Filter by tags',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  tags?: string[];

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

  @ApiPropertyOptional({ description: 'Minimum duration filter (in minutes)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum duration filter (in minutes)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxDuration?: number;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: TemplateSortFieldEnum,
    default: TemplateSortFieldEnum.CREATED_AT
  })
  @IsOptional()
  @IsEnum(TemplateSortFieldEnum)
  sortBy?: TemplateSortFieldEnum = TemplateSortFieldEnum.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort direction',
    enum: SortDirectionEnum,
    default: SortDirectionEnum.DESC
  })
  @IsOptional()
  @IsEnum(SortDirectionEnum)
  sortOrder?: SortDirectionEnum = SortDirectionEnum.DESC;

  @ApiPropertyOptional({ description: 'Search query for name, description, or category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter for most used templates only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  mostUsed?: boolean;

  @ApiPropertyOptional({ description: 'Filter for recent templates only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  recent?: boolean;
}