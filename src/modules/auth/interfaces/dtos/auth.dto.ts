import {
  Matches,
  IsString,
  Length,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class RequestOtpDto {
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phoneNumber must be a valid E.164 phone number',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phoneNumber must be a valid E.164 phone number',
  })
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
