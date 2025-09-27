import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Application Services
import { ProfileManagementService } from '../../application/services/profile-management.service';
import { AddressManagementService } from '../../application/services/address-management.service';
import { AccountControlService } from '../../application/services/account-control.service';
import { AddressEntity } from '../../domain/entities/address.entity';

// DTOs
import {
  UpdateProfileDto,
  UpdateSettingsDto,
  UserProfileResponseDto,
  UserSummaryDto,
  UserStatsDto,
  SearchUsersDto,
  BulkUpdateUsersDto,
  DeactivateAccountDto,
  ReactivateAccountDto,
  DeleteAccountDto,
  UserListResponseDto,
} from '../dtos/user-profile.dto';

import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
  SearchAddressesDto,
  NearbyAddressesDto,
  BulkAddressOperationDto,
  SetDefaultAddressDto,
  ValidateAddressDto,
  AddressValidationResponseDto,
  AddressListResponseDto,
  AddressStatsDto,
} from '../dtos/address.dto';

import {
  ChangePasswordDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  UpdateSecuritySettingsDto,
  ChangeRoleRequestDto,
  ApproveRoleChangeDto,
  Enable2FADto,
  Verify2FADto,
  Disable2FADto,
  RequestAccountDeletionDto,
  LockAccountDto,
  UnlockAccountDto,
  SecuritySettingsResponseDto,
  RoleChangeRequestResponseDto,
  TwoFactorSetupResponseDto,
  AccountDeletionRequestResponseDto,
  SecurityAuditLogDto,
  PasswordStrengthResponseDto,
} from '../dtos/account-control.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(
    private readonly profileManagementService: ProfileManagementService,
    private readonly addressManagementService: AddressManagementService,
    private readonly accountControlService: AccountControlService,
  ) {}

  // ==================== PROFILE MANAGEMENT ENDPOINTS ====================

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  async getProfile(@Request() req): Promise<UserProfileResponseDto> {
    return await this.profileManagementService.getProfile(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return await this.profileManagementService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
  }

  @Get('profile/summary')
  @ApiOperation({ summary: 'Get user profile summary' })
  @ApiResponse({
    status: 200,
    description: 'Profile summary retrieved successfully',
    type: UserSummaryDto,
  })
  async getProfileSummary(@Request() req): Promise<UserSummaryDto> {
    return await this.profileManagementService.getProfileSummary(req.user.id);
  }

  @Get('profile/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  async getUserStats(@Request() req): Promise<UserStatsDto> {
    return await this.profileManagementService.getUserStats(req.user.id);
  }

  @Post('profile/upload-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'Profile image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        profileImageUrl: { type: 'string' },
      },
    },
  })
  async uploadProfileImage(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; profileImageUrl: string }> {
    const profileImageUrl = await this.profileManagementService.uploadProfileImage(
      req.user.id,
      file,
    );
    return {
      success: true,
      message: 'Profile image uploaded successfully',
      profileImageUrl,
    };
  }

  // ==================== SETTINGS MANAGEMENT ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        emailNotifications: { type: 'boolean' },
        smsNotifications: { type: 'boolean' },
        pushNotifications: { type: 'boolean' },
        marketingEmails: { type: 'boolean' },
        preferredLanguage: { type: 'string' },
        preferredCurrency: { type: 'string' },
        timezone: { type: 'string' },
        theme: { type: 'string' },
      },
    },
  })
  async getSettings(@Request() req): Promise<any> {
    return await this.profileManagementService.getSettings(req.user.id);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async updateSettings(
    @Request() req,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.profileManagementService.updateSettings(
      req.user.id,
      updateSettingsDto,
    );
    return {
      success: true,
      message: 'Settings updated successfully',
    };
  }

  // ==================== ADDRESS MANAGEMENT ENDPOINTS ====================

  @Get('addresses')
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: [AddressResponseDto],
  })
  async getAddresses(@Request() req): Promise<AddressResponseDto[]> {
    return await this.addressManagementService.getUserAddresses(req.user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    type: AddressResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @Request() req,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return await this.addressManagementService.createAddress(
      req.user.id,
      createAddressDto,
    );
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    type: AddressResponseDto,
  })
  async updateAddress(
    @Request() req,
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return await this.addressManagementService.updateAddress(
      req.user.id,
      addressId,
      updateAddressDto,
    );
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async deleteAddress(
    @Request() req,
    @Param('id') addressId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.addressManagementService.deleteAddress(req.user.id, addressId);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @Put('addresses/:id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Default address updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async setDefaultAddress(
    @Request() req,
    @Param('id') addressId: string,
    @Body() setDefaultDto: SetDefaultAddressDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.addressManagementService.setDefaultAddress(
      req.user.id,
      addressId,
      setDefaultDto.type,
    );
    return {
      success: true,
      message: 'Default address updated successfully',
    };
  }

  @Post('addresses/validate')
  @ApiOperation({ summary: 'Validate address' })
  @ApiResponse({
    status: 200,
    description: 'Address validation completed',
    type: AddressValidationResponseDto,
  })
  async validateAddress(
    @Body() validateAddressDto: ValidateAddressDto,
  ): Promise<AddressValidationResponseDto> {
    return await this.addressManagementService.validateAddress(
      validateAddressDto,
    );
  }

  @Get('addresses/nearby')
  @ApiOperation({ summary: 'Find nearby addresses' })
  @ApiResponse({
    status: 200,
    description: 'Nearby addresses retrieved successfully',
    type: [AddressResponseDto],
  })
  async findNearbyAddresses(
    @Query() nearbyDto: NearbyAddressesDto,
  ): Promise<AddressResponseDto[]> {
    return await this.addressManagementService.findNearbyAddresses(
      nearbyDto.latitude,
      nearbyDto.longitude,
      nearbyDto.radiusKm || 5,
      nearbyDto.type,
      nearbyDto.limit || 20,
    );
  }

  // ==================== ACCOUNT CONTROL ENDPOINTS ====================

  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.changePassword(
      req.user.id,
      changePasswordDto,
    );
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Post('reset-password/request')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset request sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async requestPasswordReset(
    @Body() resetRequestDto: ResetPasswordRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.requestPasswordReset(
      resetRequestDto.email,
    );
    return {
      success: true,
      message: 'Password reset instructions sent to your email',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  @Get('security/settings')
  @ApiOperation({ summary: 'Get security settings' })
  @ApiResponse({
    status: 200,
    description: 'Security settings retrieved successfully',
    type: SecuritySettingsResponseDto,
  })
  async getSecuritySettings(
    @Request() req,
  ): Promise<SecuritySettingsResponseDto> {
    return await this.accountControlService.getSecuritySettings(req.user.id);
  }

  @Put('security/settings')
  @ApiOperation({ summary: 'Update security settings' })
  @ApiResponse({
    status: 200,
    description: 'Security settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async updateSecuritySettings(
    @Request() req,
    @Body() updateSecurityDto: UpdateSecuritySettingsDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.updateSecuritySettings(
      req.user.id,
      updateSecurityDto,
    );
    return {
      success: true,
      message: 'Security settings updated successfully',
    };
  }

  @Put('deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async deactivateAccount(
    @Request() req,
    @Body() deactivateDto: DeactivateAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.profileManagementService.deactivateAccount(
      req.user.id,
      deactivateDto.reason,
      deactivateDto.feedback,
    );
    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  }

  // ==================== ADMIN-ONLY ENDPOINTS ====================

  @Get('search')
  @ApiOperation({ summary: 'Search users (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  async searchUsers(
    @Query() searchDto: SearchUsersDto,
  ): Promise<UserListResponseDto> {
    return await this.profileManagementService.searchUsers(searchDto);
  }

  @Put('bulk-update')
  @ApiOperation({ summary: 'Bulk update users (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Users updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        updatedCount: { type: 'number' },
      },
    },
  })
  async bulkUpdateUsers(
    @Body() bulkUpdateDto: BulkUpdateUsersDto,
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    const updatedCount = await this.profileManagementService.bulkUpdateUserStatus(
      bulkUpdateDto.userIds,
      bulkUpdateDto.status,
    );
    return {
      success: true,
      message: 'Users updated successfully',
      updatedCount,
    };
  }

  @Put(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate user account (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Account reactivated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async reactivateAccount(
    @Param('id') userId: string,
    @Body() reactivateDto: ReactivateAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.profileManagementService.reactivateAccount(userId);
    return {
      success: true,
      message: 'Account reactivated successfully',
    };
  }

  @Put(':id/lock')
  @ApiOperation({ summary: 'Lock user account (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Account locked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async lockAccount(
    @Body() lockDto: LockAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.lockAccount(
      lockDto.userId,
      lockDto.reason,
      lockDto.durationHours ? parseInt(lockDto.durationHours) : undefined,
      lockDto.adminComments,
    );
    return {
      success: true,
      message: 'Account locked successfully',
    };
  }

  @Put(':id/unlock')
  @ApiOperation({ summary: 'Unlock user account (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Account unlocked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async unlockAccount(
    @Body() unlockDto: UnlockAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.accountControlService.unlockAccount(
      unlockDto.userId,
      unlockDto.reason,
      unlockDto.adminComments,
    );
    return {
      success: true,
      message: 'Account unlocked successfully',
    };
  }

  // ==================== ADDITIONAL UTILITY ENDPOINTS ====================

  @Get('addresses/stats')
  @ApiOperation({ summary: 'Get address statistics (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Address statistics retrieved successfully',
    type: AddressStatsDto,
  })
  async getAddressStats(): Promise<AddressStatsDto> {
    return await this.addressManagementService.getAddressStatistics();
  }

  @Get('addresses/search')
  @ApiOperation({ summary: 'Search addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    type: AddressListResponseDto,
  })
  async searchAddresses(
    @Request() req,
    @Query() searchDto: SearchAddressesDto,
  ): Promise<AddressListResponseDto> {
    const result = await this.addressManagementService.searchUserAddresses(
      req.user.id,
      searchDto,
    );

    return {
      addresses: result.addresses.map((address) => this.toAddressResponse(address)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
    };
  }

  @Post('addresses/bulk-operation')
  @ApiOperation({ summary: 'Bulk address operations' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        affectedCount: { type: 'number' },
      },
    },
  })
  async bulkAddressOperation(
    @Request() req,
    @Body() bulkDto: BulkAddressOperationDto,
  ): Promise<{ success: boolean; message: string; affectedCount: number }> {
    const affectedCount = await this.addressManagementService.bulkUpdateAddresses(
      req.user.id,
      bulkDto.addressIds,
      {
        isActive: bulkDto.isActive,
        isDefault: bulkDto.isDefault,
      },
    );
    return {
      success: true,
      message: 'Bulk operation completed successfully',
      affectedCount,
    };
  }

  private toAddressResponse(address: AddressEntity): AddressResponseDto {
    return {
      id: address.id,
      userId: address.userId,
      type: address.type,
      label: address.label ?? address.getDisplayName(),
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      deliveryInstructions: address.deliveryInstructions,
      accessCode: address.accessCode,
      floorNumber: address.floorNumber,
      isDefault: address.isDefault,
      isActive: address.isActive,
      usageCount: address.usageCount ?? 0,
      lastUsedAt: address.lastUsedAt,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
      fullAddress: address.getFullAddress(),
    };
  }
}
