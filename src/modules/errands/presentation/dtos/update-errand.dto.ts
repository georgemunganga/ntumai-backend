import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto, PriorityEnum } from './create-errand.dto';

export enum ErrandStatusEnum {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateErrandDto {
  @ApiPropertyOptional({ description: 'Title of the errand' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the errand' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category of the errand' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'List of specific requirements for the errand',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ description: 'Pickup location details', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Dropoff location details', type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation?: LocationDto;

  @ApiPropertyOptional({ description: 'Price for the errand in cents', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ 
    description: 'Priority level of the errand',
    enum: PriorityEnum
  })
  @IsOptional()
  @IsEnum(PriorityEnum)
  priority?: PriorityEnum;

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

  @ApiPropertyOptional({ 
    description: 'Status of the errand',
    enum: ErrandStatusEnum
  })
  @IsOptional()
  @IsEnum(ErrandStatusEnum)
  status?: ErrandStatusEnum;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsOptional()
  @IsString()
  completionNotes?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}