// Base DTOs
export * from './base';

// Authentication DTOs
export { LoginDto } from './login.dto';
export { RegisterDto } from './register.dto';
export { RefreshTokenDto } from './refresh-token.dto';
export { ForgotPasswordDto } from './forgot-password.dto';
export { ResetPasswordDto } from './reset-password.dto';

// OTP-based DTOs
export { RegisterOtpDto } from './register-otp.dto';
export { VerifyOtpDto } from './verify-otp.dto';
export { CompleteRegistrationDto } from './complete-registration.dto';
export { LoginOtpDto } from './login-otp.dto';
export { LogoutDto } from './logout.dto';

// Profile management DTOs
export { UpdateProfileDto } from './update-profile.dto';
export { ChangePasswordDto } from './change-password.dto';
export { AddAddressDto } from './add-address.dto';
export { SwitchRoleDto } from './switch-role.dto';