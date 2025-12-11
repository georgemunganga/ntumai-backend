import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  userId: string;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  defaultAddress?: string;

  @IsObject()
  @IsOptional()
  preferences?: any;
}
