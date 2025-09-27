import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom validator to ensure at least one contact method is provided
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
          return !!(obj.email || obj.phoneNumber);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Either email or phone number must be provided';
        },
      },
    });
  };
}

/**
 * Base DTO for contact information (email/phone)
 * Standardized to use E.164 phone number format for consistency
 * Provides flexible contact methods for authentication and communication
 */
export abstract class BaseContactDto {
  @ApiProperty({
    description: 'International phone number in E.164 format (+country_code + number) - standardized format for all phone operations',
    example: '+260972827372',
    required: false,
    pattern: '^\\+[1-9]\\d{1,14}$',
    format: 'phone'
  })
  @IsOptional()
  @ValidateIf((o) => !o.email || o.phoneNumber)
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number in E.164 international format (e.g., +260972827372)' })
  @IsEmailOrPhone({ message: 'Either email or phone number must be provided' })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Valid email address for verification and communication',
    example: 'john.doe@example.com',
    required: false,
    format: 'email'
  })
  @IsOptional()
  @ValidateIf((o) => !o.phoneNumber || o.email)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

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
  countryCode?: string;
}