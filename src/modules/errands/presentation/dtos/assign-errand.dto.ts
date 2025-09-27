import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class AssignErrandDto {
  @ApiProperty({ description: 'ID of the driver to assign the errand to' })
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiPropertyOptional({ 
    description: 'Estimated arrival time in minutes',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedArrivalTime?: number;

  @ApiPropertyOptional({ description: 'Additional notes for the assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}