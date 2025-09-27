export { ProfileManagementService } from './profile-management.service';
export { AddressManagementService } from './address-management.service';
export { AccountControlService } from './account-control.service';

// Export types and interfaces
export type {
  UpdateProfileRequest,
  UpdateSettingsRequest,
  ProfileCompletionResult,
  UserProfileSummary,
} from './profile-management.service';

export type {
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressValidationResult,
  NearbyAddressesQuery,
  AddressStatistics,
} from './address-management.service';

export type {
  ChangePasswordRequest,
  ResetPasswordRequest,
  UpdateSecuritySettingsRequest,
  SecurityAuditLog,
  AccountSecurityStatus,
  RoleChangeRequest,
  AccountDeletionRequest,
} from './account-control.service';