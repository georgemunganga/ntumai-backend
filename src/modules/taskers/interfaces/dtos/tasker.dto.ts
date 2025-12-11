import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { VehicleType, KycStatus } from '@prisma/client';

export class CreateTaskerDto {
  @IsString()
  userId: string;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;
}

export class UpdateTaskerDto {
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsEnum(KycStatus)
  @IsOptional()
  kycStatus?: KycStatus;

  @IsNumber()
  @IsOptional()
  lastLocationLat?: number;

  @IsNumber()
  @IsOptional()
  lastLocationLng?: number;
}
