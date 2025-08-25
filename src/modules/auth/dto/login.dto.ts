import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsPhoneNumber, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
        defaultMessage(args: ValidationArguments) {
          return 'Either email or phone number with country code must be provided';
        },
      },
    });
  };
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address (required if phone is not provided)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !(o.phone && o.countryCode))
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsEmailOrPhone({ message: 'Either email or both phone number and country code must be provided' })
  email?: string;

  @ApiProperty({
    example: '0972827372',
    description: 'Phone number without country code',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Phone number is required when email is not provided' })
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiProperty({
    example: '+26',
    description: 'Country code for phone number',
    required: false,
  })
  @ValidateIf((o) => !o.email && o.phone)
  @IsNotEmpty({ message: 'Country code is required when phone number is provided' })
  @IsString({ message: 'Country code must be a string' })
  countryCode?: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}