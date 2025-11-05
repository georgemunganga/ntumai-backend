import { IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpVerifyDto {
  @ApiProperty({
    description: 'Challenge ID from OTP request response',
    example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e',
  })
  @IsUUID()
  challengeId: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
