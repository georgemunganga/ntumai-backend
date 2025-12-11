import { IsString, IsNumber, IsDate } from 'class-validator';

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
