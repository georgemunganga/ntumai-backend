import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  AddAddressDto,
} from '../auth/dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user-id' },
        name: { type: 'string', example: 'John Doe' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        email: { type: 'string', example: 'user@example.com' },
        profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
        userType: { type: 'string', example: 'customer' },
        addresses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'addr-id' },
              type: { type: 'string', example: 'home' },
              address: { type: 'string', example: '123 Main St' },
              city: { type: 'string', example: 'New York' },
              state: { type: 'string', example: 'NY' },
              country: { type: 'string', example: 'USA' },
              postalCode: { type: 'string', example: '10001' },
              latitude: { type: 'number', example: 40.7128 },
              longitude: { type: 'number', example: -74.0060 },
              isDefault: { type: 'boolean', example: true },
            },
          },
        },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
      },
    },
  })
  async getProfile(@Request() req) {
    // TODO: Implement get profile logic
    return {
      id: 'temp-user-id',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      email: 'user@example.com',
      profileImage: 'https://example.com/profile.jpg',
      userType: 'customer',
      addresses: [
        {
          id: 'addr-1',
          type: 'home',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          latitude: 40.7128,
          longitude: -74.0060,
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile updated successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user-id' },
            name: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            email: { type: 'string', example: 'user@example.com' },
            profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
            userType: { type: 'string', example: 'customer' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00Z' },
          },
        },
      },
    },
  })
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req) {
    // TODO: Implement update profile logic
    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: 'temp-user-id',
        name: updateProfileDto.name || 'John Doe',
        phoneNumber: '+1234567890',
        email: updateProfileDto.email || 'user@example.com',
        profileImage: updateProfileDto.profileImage || 'https://example.com/profile.jpg',
        userType: 'customer',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    // TODO: Implement change password logic
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Post('upload-profile-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        imageUrl: { type: 'string', example: 'https://example.com/uploaded-image.jpg' },
      },
    },
  })
  async uploadProfileImage(@UploadedFile() file: any) {
    // TODO: Implement image upload logic
    return {
      success: true,
      imageUrl: 'https://example.com/uploaded-image.jpg',
    };
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add new address' })
  @ApiResponse({
    status: 200,
    description: 'Address added successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        address: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'addr-id' },
            type: { type: 'string', example: 'home' },
            address: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            state: { type: 'string', example: 'NY' },
            country: { type: 'string', example: 'USA' },
            postalCode: { type: 'string', example: '10001' },
            latitude: { type: 'number', example: 40.7128 },
            longitude: { type: 'number', example: -74.0060 },
            isDefault: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  async addAddress(@Body() addAddressDto: AddAddressDto) {
    // TODO: Implement add address logic
    return {
      success: true,
      address: {
        id: 'temp-addr-id',
        type: addAddressDto.type,
        address: addAddressDto.address,
        city: addAddressDto.city,
        state: addAddressDto.state,
        country: addAddressDto.country,
        postalCode: addAddressDto.postalCode,
        latitude: addAddressDto.latitude,
        longitude: addAddressDto.longitude,
        isDefault: addAddressDto.isDefault,
      },
    };
  }
}