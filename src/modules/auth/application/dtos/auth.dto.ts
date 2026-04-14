import { IsOptional, IsString, Length } from 'class-validator';

export class LegacyRequestOtpDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class LegacyVerifyOtpDto {
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
