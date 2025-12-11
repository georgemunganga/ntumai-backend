import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  customerId: string;

  @IsString()
  vendorId: string;

  @IsString()
  taskId: string;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  deliveryFee: number;

  @IsArray()
  items: any[];
}

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  status?: string;
}
