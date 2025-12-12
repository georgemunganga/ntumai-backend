import { IsOptional, IsString, Length } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
