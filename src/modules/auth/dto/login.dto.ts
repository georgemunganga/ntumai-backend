import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Custom validator to ensure at least one of email or phone is provided
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
          return !!(obj.email || (obj.phone && obj.countryCode));
        },
        defaultMessage() {
          return 'Either email or both phone and country code must be provided';
        },
      },
    });
  };
}

/**
 * Data Transfer Object for user authentication
 * Supports both email and split phone number based login
 */
export class LoginDto {
  @ApiPropertyOptional({
    description: 'Valid email address for login (required if phone number is not provided)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsOptional()
  @ValidateIf((o) => !(o.phone && o.countryCode))
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsEmailOrPhone({ message: 'Either email or both phone and country code must be provided' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number without country code (required with countryCode when email is not provided)',
    example: '972827372',
    pattern: '^\\d{5,15}$',
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not provided' })
  @Matches(/^\d{5,15}$/, { message: 'Phone number must be between 5 and 15 digits' })
  @IsString({ message: 'Phone number must be a string of digits' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'International dialling code prefixed with + (required with phone when email is not provided)',
    example: '+260',
    pattern: '^\\+?\\d{1,4}$',
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Country code is required when using phone login' })
  @Matches(/^\+?\d{1,4}$/, { message: 'Country code must include digits and may start with +' })
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiProperty({
    description: 'User password - minimum 6 characters for security',
    example: 'MySecurePass123!',
    minLength: 6,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;
}
