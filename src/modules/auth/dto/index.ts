// Base DTOs
export * from './base';

// Authentication DTOs
export { LoginDto } from './login.dto';
export { RegisterDto } from './register.dto';
export { RefreshTokenDto } from './refresh-token.dto';
export { ForgotPasswordDto } from './forgot-password.dto';
export { ResetPasswordDto } from './reset-password.dto';

// OTP-based DTOs
export { LogoutDto } from './logout.dto';
export { OtpRequestDto } from './otp-request.dto';
export { OtpVerifyDto } from './otp-verify.dto';

// Profile management DTOs
export { UpdateProfileDto } from './update-profile.dto';
export { ChangePasswordDto } from './change-password.dto';
export { AddAddressDto } from './add-address.dto';
export { SwitchRoleDto } from './switch-role.dto';
