import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiProperty({ description: 'Address of the location' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Latitude coordinate', minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Special instructions for the location' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export enum PriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateErrandDto {
  @ApiProperty({ description: 'Title of the errand' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the errand' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Category of the errand' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ 
    description: 'List of specific requirements for the errand',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ description: 'Pickup location details', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @ApiProperty({ description: 'Dropoff location details', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation: LocationDto;

  @ApiProperty({ description: 'Price for the errand in cents', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ 
    description: 'Priority level of the errand',
    enum: PriorityEnum,
    default: PriorityEnum.MEDIUM
  })
  @IsEnum(PriorityEnum)
  priority: PriorityEnum;

  @ApiPropertyOptional({ 
    description: 'Deadline for the errand completion (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ 
    description: 'Estimated duration in minutes',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Template ID to use for creating the errand' })
  @IsOptional()
  @IsString()
  templateId?: string;
}