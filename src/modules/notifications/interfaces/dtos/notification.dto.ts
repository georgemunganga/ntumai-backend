import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsObject()
  @IsOptional()
  data?: any;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
