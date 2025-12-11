import { IsPhoneNumber, IsString, Length, IsEnum, IsOptional, IsEmail } from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @IsPhoneNumber('ZZ') // 'ZZ' for any country, replace with specific country code if needed
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @IsPhoneNumber('ZZ')
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(4, 6)
  otp: string;
}

export class SwitchRoleDto {
  @IsEnum(['CUSTOMER', 'TASKER', 'VENDOR'])
  roleType: 'CUSTOMER' | 'TASKER' | 'VENDOR';
}
