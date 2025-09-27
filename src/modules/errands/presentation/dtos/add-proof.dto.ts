import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
} from 'class-validator';

export enum ProofTypeEnum {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  SIGNATURE = 'signature',
  RECEIPT = 'receipt',
  GPS_LOCATION = 'gps_location',
}

export class AddProofDto {
  @ApiProperty({ 
    description: 'Type of proof being added',
    enum: ProofTypeEnum
  })
  @IsEnum(ProofTypeEnum)
  type: ProofTypeEnum;

  @ApiProperty({ description: 'URL or path to the proof file' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Description or notes about the proof' })
  @IsOptional()
  @IsString()
  description?: string;
}