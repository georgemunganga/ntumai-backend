import { IsString, IsOptional, IsObject, IsNumber, IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  customerId: string;

  @IsString()
  taskType: string;

  @IsObject()
  pickupAddress: any;

  @IsObject()
  dropoffAddress: any;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  details?: any;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  taskerId?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
