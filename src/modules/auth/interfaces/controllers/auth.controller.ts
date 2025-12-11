import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/application/services/auth.service';
import { VerifyOtpDto, SwitchRoleDto, RequestOtpDto } from 'src/modules/auth/interfaces/dtos/auth.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @ApiOperation({ summary: 'Request OTP for sign-up or login via phone number or email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestOtp(dto.phoneNumber, dto.email);
    return { message: 'OTP sent' };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and return JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const tokens = await this.authService.verifyOtp(dto.otp, dto.phoneNumber, dto.email);
    return tokens;
  }

  @Post('role-switch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch active user role' })
  @ApiResponse({ status: 200, description: 'Role switched, returns new JWT tokens.' })
  @UseGuards(JwtAuthGuard)
  async switchRole(@Request() req, @Body() dto: SwitchRoleDto) {
    const userId = req.user.sub; // Assuming 'sub' is the user ID in the JWT payload
    const tokens = await this.authService.switchRole(userId, dto.roleType);
    return tokens;
  }
}
