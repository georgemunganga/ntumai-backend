import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

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
 * Base DTO for contact information (email/phone)
 * Standardized to accept split phone inputs (national number + country code)
 * Provides flexible contact methods for authentication and communication
 */
export abstract class BaseContactDto {
  @ApiPropertyOptional({
    description: 'Phone number without the country code',
    example: '972827372',
    pattern: '^\\d{5,15}$',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not provided' })
  @Matches(/^\d{5,15}$/, { message: 'Phone number must be between 5 and 15 digits' })
  @IsString({ message: 'Phone number must be a string of digits' })
  @IsEmailOrPhone({ message: 'Either email or phone with country code must be provided' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'International dialling code prefixed with +',
    example: '+260',
    pattern: '^\\+?\\d{1,4}$',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Country code is required when phone is provided' })
  @Matches(/^\+?\d{1,4}$/, { message: 'Country code must include digits and may start with +' })
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Valid email address for verification and communication',
    example: 'john.doe@example.com',
    required: false,
    format: 'email',
  })
  @IsOptional()
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ValidateIf((dto) => !dto.email && (!dto.phone || !dto.countryCode))
  @IsNotEmpty({ message: 'Either email or both phone and country code must be provided' })
  contactGuard?: string;
}
