import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SwitchRoleDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
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

  @Post('switch-role')
  @ApiOperation({ summary: 'Switch an existing role for the authenticated user' })
  async switchRole(@Body() switchRoleDto: SwitchRoleDto, @Request() req) {
    const userId = req.user?.id ?? switchRoleDto.email ?? 'demo-user-id';
    return this.usersService.switchRole(userId, switchRoleDto);
  }

  @Post('register-role')
  @ApiOperation({ summary: 'Register for a new role' })
  async registerRole(@Body() switchRoleDto: SwitchRoleDto, @Request() req) {
    const userId = req.user?.id ?? switchRoleDto.email ?? 'demo-user-id';
    return this.usersService.registerForRole(
      userId,
      switchRoleDto.targetRole,
      switchRoleDto.otpCode,
      switchRoleDto.phoneNumber,
      switchRoleDto.email,
    );
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get roles available to the authenticated user' })
  async getUserRoles(@Request() req) {
    const userId = req.user?.id ?? 'demo-user-id';
    return this.usersService.getUserRoles(userId);
  }
}
