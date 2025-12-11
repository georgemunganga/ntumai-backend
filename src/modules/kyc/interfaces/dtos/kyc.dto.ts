import { IsString, IsEnum, IsOptional } from 'class-validator';
import { KycStatus } from '@prisma/client';

export class CreateKycDto {
  @IsString()
  userId: string;

  @IsString()
  documentType: string;

  @IsString()
  documentUrl: string;
}

export class UpdateKycDto {
  @IsEnum(KycStatus)
  @IsOptional()
  status?: KycStatus;
}
