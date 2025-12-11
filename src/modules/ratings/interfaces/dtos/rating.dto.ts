import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  customerId: string;

  @IsString()
  @IsOptional()
  taskerId?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
