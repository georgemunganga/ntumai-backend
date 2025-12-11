import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class CreateVendorDto {
  @IsString()
  userId: string;

  @IsString()
  businessName: string;

  @IsString()
  businessType: string;
}

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsEnum(KycStatus)
  @IsOptional()
  kycStatus?: KycStatus;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;
}
