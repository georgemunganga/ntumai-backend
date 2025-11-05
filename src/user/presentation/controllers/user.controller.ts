import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { UserService } from '../../application/services/user.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UploadProfileImageDto,
} from '../../application/dtos/request/update-profile.dto';
import {
  SwitchRoleDto,
  RegisterRoleDto,
} from '../../application/dtos/request/role-management.dto';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '../../application/dtos/request/address.dto';
import { RegisterPushTokenDto } from '../../application/dtos/request/device.dto';
import {
  UserProfileResponseDto,
  UserRolesResponseDto,
  AddressResponseDto,
  DeviceResponseDto,
} from '../../application/dtos/response/user-profile.response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserProfileResponseDto,
  })
  async getProfile(@Request() req): Promise<UserProfileResponseDto> {
    return this.userService.getUserProfile(req.user.userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: UserProfileResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({
    status: 200,
    description: 'User roles retrieved',
    type: UserRolesResponseDto,
  })
  async getRoles(@Request() req): Promise<UserRolesResponseDto> {
    return this.userService.getUserRoles(req.user.userId);
  }

  @Post('switch-role')
  @ApiOperation({ summary: 'Switch to a different role' })
  @ApiResponse({ status: 200, description: 'Role switched successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid role or missing verification',
  })
  @ApiResponse({ status: 409, description: 'Role not registered' })
  async switchRole(@Request() req, @Body() dto: SwitchRoleDto) {
    return this.userService.switchRole(req.user.userId, dto);
  }

  @Post('register-role')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new role for the user' })
  @ApiResponse({ status: 201, description: 'Role registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Verification required or invalid OTP',
  })
  @ApiResponse({ status: 409, description: 'Role already active' })
  async registerRole(@Request() req, @Body() dto: RegisterRoleDto) {
    return this.userService.registerRole(req.user.userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Weak password' })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    await this.userService.changePassword(req.user.userId, dto);
    return { success: true, message: 'Password changed successfully' };
  }

  @Post('upload-profile-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200, description: 'Profile image uploaded' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Request() req,
    @Body() dto: UploadProfileImageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If file is uploaded, handle file upload (TODO: implement S3/CDN upload)
    // For now, just accept the imageUrl from body
    const imageUrl =
      dto.imageUrl || 'https://cdn.example.com/default-avatar.jpg';
    return this.userService.uploadProfileImage(req.user.userId, imageUrl);
  }

  // Address Management
  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created',
    type: AddressResponseDto,
  })
  async createAddress(@Request() req, @Body() dto: CreateAddressDto) {
    const address = await this.userService.createAddress(req.user.userId, dto);
    return { success: true, data: { address } };
  }

  @Put('addresses/:addressId')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({
    status: 200,
    description: 'Address updated',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Request() req,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.userService.updateAddress(
      req.user.userId,
      addressId,
      dto,
    );
    return {
      success: true,
      message: 'Address updated successfully',
      data: { address },
    };
  }

  @Delete('addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(@Request() req, @Param('addressId') addressId: string) {
    await this.userService.deleteAddress(req.user.userId, addressId);
    return { success: true, message: 'Address deleted successfully' };
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved',
    type: [AddressResponseDto],
  })
  async getAddresses(@Request() req) {
    const addresses = await this.userService.getAddresses(req.user.userId);
    return { success: true, data: { addresses } };
  }

  @Post('addresses/:addressId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ status: 200, description: 'Default address set' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultAddress(
    @Request() req,
    @Param('addressId') addressId: string,
  ) {
    const result = await this.userService.setDefaultAddress(
      req.user.userId,
      addressId,
    );
    return { success: true, data: result };
  }

  @Get('addresses/default')
  @ApiOperation({ summary: 'Get default address' })
  @ApiResponse({
    status: 200,
    description: 'Default address retrieved',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No default address set' })
  async getDefaultAddress(@Request() req) {
    const address = await this.userService.getDefaultAddress(req.user.userId);
    return { success: true, data: { address } };
  }

  // Device Management
  @Post('push-tokens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register push token for notifications' })
  @ApiResponse({ status: 201, description: 'Push token registered' })
  async registerPushToken(@Request() req, @Body() dto: RegisterPushTokenDto) {
    const result = await this.userService.registerPushToken(
      req.user.userId,
      dto,
    );
    return { success: true, data: result };
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({
    status: 200,
    description: 'Devices retrieved',
    type: [DeviceResponseDto],
  })
  async getDevices(@Request() req) {
    const devices = await this.userService.getDevices(req.user.userId);
    return { success: true, data: { devices } };
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete device and revoke push token' })
  @ApiResponse({ status: 200, description: 'Device deleted' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    await this.userService.deleteDevice(req.user.userId, deviceId);
    return { success: true, message: 'Device deleted successfully' };
  }

  // Preferences
  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  async getPreferences(@Request() req) {
    const preferences = await this.userService.getPreferences(req.user.userId);
    return { success: true, data: preferences };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updatePreferences(@Request() req, @Body() preferences: any) {
    const updated = await this.userService.updatePreferences(
      req.user.userId,
      preferences,
    );
    return { success: true, data: updated };
  }
}
