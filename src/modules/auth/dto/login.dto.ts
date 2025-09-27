import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsPhoneNumber, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Custom validator to ensure at least one of email or phone is provided
// Supports both new E.164 phoneNumber format and legacy phone/countryCode fields
function IsEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          return !!(obj.email || obj.phoneNumber || (obj.phone && obj.countryCode));
        },
        defaultMessage(args: ValidationArguments) {
          return 'Either email or phone number (E.164 format or phone+countryCode) must be provided';
        },
      },
    });
  };
}

/**
 * Data Transfer Object for user authentication
 * Supports both email and phone number based login with secure password validation
 */
export class LoginDto {
  @ApiProperty({
    description: 'Valid email address for login (required if phone number is not provided) - must be a registered email',
    example: 'john.doe@example.com',
    required: false,
    format: 'email'
  })
  @IsOptional()
  @ValidateIf((o) => !(o.phone && o.countryCode))
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsEmailOrPhone({ message: 'Either email or both phone number and country code must be provided' })
  email?: string;

  @ApiProperty({
    description: 'International phone number in E.164 format (required if email is not provided) - must be a registered phone number',
    example: '+260972827372',
    required: false,
    pattern: '^\\+[1-9]\\d{1,14}$',
    format: 'phone'
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not provided' })
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number in E.164 international format (e.g., +260972827372)' })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Phone number without country code - DEPRECATED: Use phoneNumber in E.164 format instead',
    example: '972827372',
    required: false,
    pattern: '^[0-9]{8,15}$',
    deprecated: true
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^[0-9]{8,15}$/, { message: 'Phone number must contain only digits and be 8-15 characters long' })
  phone?: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code - DEPRECATED: Use phoneNumber in E.164 format instead',
    example: 'ZM',
    required: false,
    pattern: '^[A-Z]{2}$',
    minLength: 2,
    maxLength: 2,
    deprecated: true
  })
  @IsOptional()
  @IsString({ message: 'Country code must be a string' })
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be a valid 2-letter ISO country code' })
  countryCode?: string;

  @ApiProperty({
    description: 'User password - minimum 6 characters for security',
    example: 'MySecurePass123!',
    minLength: 6,
    maxLength: 128,
    format: 'password'
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}