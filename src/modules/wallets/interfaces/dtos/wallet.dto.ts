import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNumber()
  @IsOptional()
  floatBalance?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateWalletDto {
  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNumber()
  @IsOptional()
  floatBalance?: number;
}
