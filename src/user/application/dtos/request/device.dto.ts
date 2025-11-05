import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'android_123' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios', 'web'] })
  @IsEnum(['android', 'ios', 'web'])
  platform: string;

  @ApiProperty({ example: 'fcm-XXXX' })
  @IsString()
  pushToken: string;
}
