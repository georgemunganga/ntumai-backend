import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwitchRoleDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
<<<<<<< HEAD
  @ApiOperation({ summary: 'Get current user profile (placeholder response)' })
  @ApiResponse({ status: 200, description: 'Returns a mock user profile for now.' })
  getProfile(@Request() req) {
    const userId = req.user?.id ?? 'demo-user-id';
    return {
      id: userId,
      name: 'Demo User',
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      currentRole: 'customer',
      availableRoles: ['customer'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

=======
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
    return await this.usersService.getProfile(req.user.id);
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
    return await this.usersService.updateProfile(req.user.id, updateProfileDto);
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
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req) {
    return await this.usersService.changePassword(req.user.id, changePasswordDto);
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
  async uploadProfileImage(@Request() req, @UploadedFile() file: any) {
    const profileImageUrl = await this.usersService.updateProfileImage(req.user.id, file);
    return {
      success: true,
      imageUrl: profileImageUrl,
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
  async addAddress(@Body() addAddressDto: AddAddressDto, @Request() req) {
    return await this.usersService.addAddress(req.user.id, addAddressDto);
  }

>>>>>>> main
  @Post('switch-role')
  @ApiOperation({ summary: 'Switch an existing role for the authenticated user' })
  async switchRole(@Body() switchRoleDto: SwitchRoleDto, @Request() req) {
    const userId = req.user?.id ?? switchRoleDto.email ?? 'demo-user-id';
    return this.usersService.switchRole(userId, switchRoleDto);
  }

  @Post('register-role')
  @ApiOperation({ summary: 'Register for a new role' })
  async registerRole(@Body() switchRoleDto: SwitchRoleDto, @Request() req) {
<<<<<<< HEAD
    const userId = req.user?.id ?? switchRoleDto.email ?? 'demo-user-id';
    return this.usersService.registerForRole(
      userId,
      switchRoleDto.targetRole,
      switchRoleDto.otpCode,
      switchRoleDto.phoneNumber,
      switchRoleDto.email,
    );
=======
    const userId = req.user.id;
    return await this.usersService.registerForRole(userId, switchRoleDto);
>>>>>>> main
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get roles available to the authenticated user' })
  async getUserRoles(@Request() req) {
    const userId = req.user?.id ?? 'demo-user-id';
    return this.usersService.getUserRoles(userId);
  }
}
