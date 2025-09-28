import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class OtpVerifyDto {
  @ApiProperty({
    description: 'Challenge identifier returned from /auth/otp/request',
    example: 'a5c1d19e-0f4b-4c26-91d5-2f25b1d83c2e',
  })
  @IsString({ message: 'challengeId must be a string' })
  @IsNotEmpty({ message: 'challengeId is required' })
  challengeId: string;

  @ApiProperty({
    description: '6 digit OTP code received by the user',
    example: '123456',
  })
  @IsString({ message: 'otp must be a string' })
  @Length(6, 6, { message: 'otp must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'otp must contain only digits' })
  otp: string;
}
