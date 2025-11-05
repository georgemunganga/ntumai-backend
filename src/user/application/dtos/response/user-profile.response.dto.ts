import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiProperty({ example: 'clh7x9k2l0000qh8v4g2m1n3p' })
  id: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+260972827372', required: false })
  phone?: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.jpg',
    required: false,
  })
  profileImage?: string;

  @ApiProperty({ enum: UserRole, example: 'CUSTOMER' })
  currentRole: UserRole;

  @ApiProperty({
    enum: UserRole,
    isArray: true,
    example: ['CUSTOMER', 'VENDOR'],
  })
  roles: UserRole[];

  @ApiProperty({ example: true })
  profileComplete: boolean;

  @ApiProperty({ example: '2025-01-10T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-19T10:30:00Z' })
  updatedAt: Date;
}

export class RoleInfoDto {
  @ApiProperty({ enum: UserRole, example: 'CUSTOMER' })
  role: UserRole;

  @ApiProperty({ example: true })
  active: boolean;
}

export class UserRolesResponseDto {
  @ApiProperty({ enum: UserRole, example: 'CUSTOMER' })
  currentRole: UserRole;

  @ApiProperty({ type: [RoleInfoDto] })
  roles: RoleInfoDto[];
}

export class AddressResponseDto {
  @ApiProperty({ example: 'addr_abc123' })
  id: string;

  @ApiProperty({ example: 'home' })
  type: string;

  @ApiProperty({ example: 'Home', required: false })
  label?: string;

  @ApiProperty({ example: 'Plot 10, Addis Ababa Dr' })
  address: string;

  @ApiProperty({ example: 'Lusaka' })
  city: string;

  @ApiProperty({ example: 'Lusaka' })
  state: string;

  @ApiProperty({ example: 'ZM' })
  country: string;

  @ApiProperty({ example: '10101', required: false })
  postalCode?: string;

  @ApiProperty({ example: -15.3875 })
  latitude: number;

  @ApiProperty({ example: 28.3228 })
  longitude: number;

  @ApiProperty({ example: 'Call when at the gate', required: false })
  instructions?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  contactName?: string;

  @ApiProperty({ example: '+260972827372', required: false })
  contactPhone?: string;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: '2025-10-19T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-19T12:00:00Z' })
  updatedAt: Date;
}

export class DeviceResponseDto {
  @ApiProperty({ example: 'android_123' })
  deviceId: string;

  @ApiProperty({ example: 'android' })
  platform: string;

  @ApiProperty({ example: '2025-10-19T12:01:00Z' })
  lastSeen: Date;
}
