import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class AddAddressDto {
  @ApiProperty({
    description: 'Token ID',
    example: 'token-123',
  })
  @IsString()
  tokenid: string;

  @ApiProperty({
    description: 'Address type',
    example: 'home',
    enum: ['home', 'work', 'other'],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'NY',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  postalCode: string;

  @ApiProperty({
    description: 'Latitude',
    example: 40.7128,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: -74.0060,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Is default address',
    example: true,
  })
  @IsBoolean()
  isDefault: boolean;
}