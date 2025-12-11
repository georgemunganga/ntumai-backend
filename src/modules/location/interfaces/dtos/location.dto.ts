import { IsString, IsNumber, IsDate, IsOptional, IsISO8601 } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  userId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsDate()
  timestamp: Date;
}

export class TaskerLocationUpdateDto {
  @IsString()
  taskerId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}
