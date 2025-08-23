// New consolidated service
export { UserManagementDomainService } from './user-management-domain.service';
export type { 
  AuthenticationResult, 
  LoginAttempt, 
  PasswordResetToken, 
  PasswordStrengthResult 
} from './user-management-domain.service';

// Legacy services (deprecated - use UserManagementDomainService instead)
export { AuthenticationDomainService } from './authentication-domain.service';
export { PasswordService } from './password.service';