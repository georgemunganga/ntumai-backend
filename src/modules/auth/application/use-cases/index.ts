// Consolidated Use Cases (Recommended)
export { AuthenticationUseCase } from './authentication.use-case';
export { OtpManagementUseCase } from './otp-management.use-case';

// Legacy Individual Use Cases (Maintained for backward compatibility)
export { ChangePasswordUseCase } from './change-password.use-case';
export { ForgotPasswordUseCase } from './forgot-password.use-case';
export { GetUserProfileUseCase } from './get-user-profile.use-case';
export { LoginUserUseCase } from './login-user.use-case';
export { LogoutUserUseCase } from './logout-user.use-case';
export { RefreshTokenUseCase } from './refresh-token.use-case';
export { RegisterUserUseCase } from './register-user.use-case';
export { ResetPasswordUseCase } from './reset-password.use-case';

// Re-export command and result interfaces for convenience
export type {
  BaseOtpCommand,
  GenerateRegistrationOtpCommand,
  GenerateLoginOtpCommand,
  GeneratePasswordResetOtpCommand,
  VerifyOtpCommand,
  CompleteRegistrationCommand,
  CompletePasswordResetCommand,
  OtpGenerationResult,
  OtpVerificationResult,
  RegistrationResult,
  LoginResult,
  PasswordResetResult,
} from './otp-management.use-case';

// Legacy Command and Result Types
export type {
  RegisterUserCommand as LegacyRegisterUserCommand,
  RegisterUserResult,
} from './register-user.use-case';

export type {
  LoginUserCommand as LegacyLoginUserCommand,
  LoginUserResult,
} from './login-user.use-case';

export type {
  RefreshTokenCommand as LegacyRefreshTokenCommand,
  RefreshTokenResult,
} from './refresh-token.use-case';

export type {
  ChangePasswordCommand,
  ChangePasswordResult,
} from './change-password.use-case';

export type {
  ForgotPasswordCommand,
  ForgotPasswordResult,
} from './forgot-password.use-case';

export type {
  ResetPasswordCommand,
  ResetPasswordResult,
} from './reset-password.use-case';

export type {
  LogoutUserCommand as LegacyLogoutUserCommand,
  LogoutUserResult,
} from './logout-user.use-case';

export type {
  GetUserProfileCommand as LegacyGetUserProfileCommand,
  GetUserProfileResult,
} from './get-user-profile.use-case';