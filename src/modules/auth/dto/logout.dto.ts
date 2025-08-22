import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description: 'Device ID',
    example: 'device-123',
  })
  @IsString()
  deviceId: string;
}