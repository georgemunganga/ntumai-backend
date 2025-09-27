import { UserRole } from '@prisma/client';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserSettings } from '../value-objects/user-settings.vo';
import { UserStats } from '../value-objects/user-stats.vo';
import { DriverDetails } from '../value-objects/driver-details.vo';
import { VendorDetails } from '../value-objects/vendor-details.vo';
import { CustomerDetails } from '../value-objects/customer-details.vo';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserEntityProps {
  id: string;
  email: string;
  phone: string;
  password: string;
  name: string;
  currentRole: UserRole;
  availableRoles: UserRole[];
  status: UserStatus;
  isVerified: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profile: UserProfile;
  settings: UserSettings;
  stats: UserStats;
  driverDetails?: DriverDetails;
  vendorDetails?: VendorDetails;
  customerDetails?: CustomerDetails;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  private constructor(private readonly props: UserEntityProps) {}

  static create(props: Omit<UserEntityProps, 'id' | 'createdAt' | 'updatedAt'>): UserEntity {
    const now = new Date();
    return new UserEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(prismaUser: any): UserEntity {
    // Create profile value object
    const profile = UserProfile.create({
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      dateOfBirth: prismaUser.dateOfBirth,
      gender: prismaUser.gender,
      bio: prismaUser.bio,
      website: prismaUser.website,
      socialLinks: prismaUser.socialLinks,
      emergencyContact: prismaUser.emergencyContact,
      preferences: {
        language: prismaUser.preferredLanguage || 'en',
        timezone: prismaUser.timezone || 'UTC',
        currency: prismaUser.preferredCurrency || 'USD'
      }
    });

    // Create settings value object
    const settings = UserSettings.create({
      notifications: {
        email: {
          orderUpdates: prismaUser.emailNotifications?.orderUpdates || false,
          promotions: prismaUser.marketingEmails || false,
          newsletter: prismaUser.emailNotifications?.newsletter || false,
          security: prismaUser.emailNotifications?.security || false
        },
        sms: {
          orderUpdates: prismaUser.smsNotifications?.orderUpdates || false,
          promotions: prismaUser.smsNotifications?.promotions || false,
          security: prismaUser.smsNotifications?.security || false
        },
        push: {
          orderUpdates: prismaUser.pushNotifications?.orderUpdates || false,
          promotions: prismaUser.pushNotifications?.promotions || false,
          chat: prismaUser.pushNotifications?.chat || false,
          general: prismaUser.pushNotifications?.general || false
        }
      },
      privacy: {
        profileVisibility: prismaUser.profileVisibility || 'PUBLIC',
        showOnlineStatus: prismaUser.showOnlineStatus || false,
        allowDirectMessages: prismaUser.privacy?.allowDirectMessages || true,
        showEmail: prismaUser.privacy?.showEmail || false,
        showPhone: prismaUser.privacy?.showPhone || false
      },
      preferences: {
        theme: prismaUser.theme || 'LIGHT',
        language: prismaUser.preferredLanguage || 'en',
        timezone: prismaUser.timezone || 'UTC',
        currency: prismaUser.preferredCurrency || 'USD',
        dateFormat: prismaUser.preferences?.dateFormat || 'DD/MM/YYYY',
        timeFormat: prismaUser.preferences?.timeFormat || '24H'
      },
      security: {
        twoFactorEnabled: prismaUser.twoFactorEnabled || false,
        loginNotifications: prismaUser.loginNotifications || false,
        sessionTimeout: prismaUser.security?.sessionTimeout || 30,
        allowMultipleSessions: prismaUser.security?.allowMultipleSessions || true
      },
      delivery: {
        defaultAddressId: prismaUser.defaultAddressId,
        preferredDeliveryTime: prismaUser.delivery?.preferredDeliveryTime || 'ANYTIME',
        specialInstructions: prismaUser.deliveryInstructions,
        contactlessDelivery: prismaUser.delivery?.contactlessDelivery || false
      }
    });

    // Create stats value object
    const stats = UserStats.create({
      totalOrders: prismaUser.totalOrders || 0,
      totalSpent: prismaUser.totalSpent || 0,
      averageOrderValue: prismaUser.stats?.averageOrderValue || 0,
      lastOrderDate: prismaUser.stats?.lastOrderDate,
      memberSince: prismaUser.createdAt,
      loyaltyPoints: prismaUser.loyaltyPoints || 0,
      customerStats: {
        favoriteCategories: prismaUser.stats?.favoriteCategories || [],
        preferredStores: prismaUser.stats?.preferredStores || [],
        reviewsGiven: prismaUser.stats?.reviewsGiven || 0,
        averageRating: prismaUser.averageRating || 0,
        cancelledOrders: prismaUser.cancelledOrders || 0,
        returnedOrders: prismaUser.stats?.returnedOrders || 0
      }
    });

    // Create user entity
    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email,
      phone: prismaUser.phone,
      password: prismaUser.password,
      name: `${prismaUser.firstName || ''} ${prismaUser.lastName || ''}`.trim() || 'User',
      currentRole: prismaUser.currentRole,
      availableRoles: prismaUser.userRoles?.map((role: any) => role.role) || [prismaUser.currentRole],
      status: prismaUser.status,
      isVerified: prismaUser.isEmailVerified || prismaUser.isPhoneVerified || false,
      isPhoneVerified: prismaUser.isPhoneVerified || false,
      isEmailVerified: prismaUser.isEmailVerified || false,
      profile,
      settings,
      stats,
      driverDetails: prismaUser.driverDetails,
      vendorDetails: prismaUser.vendorDetails,
      customerDetails: prismaUser.customerDetails,
      lastLoginAt: prismaUser.lastLoginAt,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get password(): string {
    return this.props.password;
  }

  get name(): string {
    return this.props.name;
  }

  get currentRole(): UserRole {
    return this.props.currentRole;
  }

  get availableRoles(): UserRole[] {
    return [...this.props.availableRoles];
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get isPhoneVerified(): boolean {
    return this.props.isPhoneVerified;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get profile(): UserProfile {
    return this.props.profile;
  }

  get settings(): UserSettings {
    return this.props.settings;
  }

  get stats(): UserStats {
    return this.props.stats;
  }

  get driverDetails(): DriverDetails | undefined {
    return this.props.driverDetails;
  }

  get vendorDetails(): VendorDetails | undefined {
    return this.props.vendorDetails;
  }

  get customerDetails(): CustomerDetails | undefined {
    return this.props.customerDetails;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  switchRole(targetRole: UserRole): void {
    if (!this.props.availableRoles.includes(targetRole)) {
      throw new Error(`User does not have access to role: ${targetRole}`);
    }

    if (this.props.status !== UserStatus.ACTIVE) {
      throw new Error('Cannot switch roles for inactive user');
    }

    this.props.currentRole = targetRole;
    this.props.updatedAt = new Date();
  }

  addRole(role: UserRole): void {
    if (this.props.availableRoles.includes(role)) {
      throw new Error(`User already has role: ${role}`);
    }

    this.props.availableRoles.push(role);
    this.props.updatedAt = new Date();
  }

  removeRole(role: UserRole): void {
    if (role === this.props.currentRole) {
      throw new Error('Cannot remove current active role');
    }

    const index = this.props.availableRoles.indexOf(role);
    if (index === -1) {
      throw new Error(`User does not have role: ${role}`);
    }

    this.props.availableRoles.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  verifyPhone(): void {
    this.props.isPhoneVerified = true;
    this.updateVerificationStatus();
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.updateVerificationStatus();
  }

  private updateVerificationStatus(): void {
    this.props.isVerified = this.props.isPhoneVerified && this.props.isEmailVerified;
    
    if (this.props.isVerified && this.props.status === UserStatus.PENDING_VERIFICATION) {
      this.props.status = UserStatus.ACTIVE;
    }
    
    this.props.updatedAt = new Date();
  }

  updateProfile(profile: UserProfile): void {
    this.props.profile = profile;
    this.props.updatedAt = new Date();
  }

  updateSettings(settings: UserSettings): void {
    this.props.settings = settings;
    this.props.updatedAt = new Date();
  }

  updateStats(stats: UserStats): void {
    this.props.stats = stats;
    this.props.updatedAt = new Date();
  }

  setDriverDetails(details: DriverDetails): void {
    if (!this.props.availableRoles.includes(UserRole.DRIVER)) {
      throw new Error('User must have DRIVER role to set driver details');
    }
    this.props.driverDetails = details;
    this.props.updatedAt = new Date();
  }

  setVendorDetails(details: VendorDetails): void {
    if (!this.props.availableRoles.includes(UserRole.VENDOR)) {
      throw new Error('User must have VENDOR role to set vendor details');
    }
    this.props.vendorDetails = details;
    this.props.updatedAt = new Date();
  }

  setCustomerDetails(details: CustomerDetails): void {
    if (!this.props.availableRoles.includes(UserRole.CUSTOMER)) {
      throw new Error('User must have CUSTOMER role to set customer details');
    }
    this.props.customerDetails = details;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new Error('Cannot activate suspended user. Contact administrator.');
    }
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = UserStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  reactivate(): UserEntity {
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
    return this;
  }

  updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  changePassword(newPassword: string): void {
    // Password should be hashed before calling this method
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  updateContactInfo(email?: string, phone?: string): void {
    if (email && email !== this.props.email) {
      this.props.email = email;
      this.props.isEmailVerified = false;
    }

    if (phone && phone !== this.props.phone) {
      this.props.phone = phone;
      this.props.isPhoneVerified = false;
    }

    this.updateVerificationStatus();
  }

  // Helper methods
  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.props.status === UserStatus.SUSPENDED;
  }

  hasRole(role: UserRole): boolean {
    return this.props.availableRoles.includes(role);
  }

  canSwitchToRole(role: UserRole): boolean {
    return this.hasRole(role) && this.isActive();
  }

  isFullyVerified(): boolean {
    return this.props.isVerified && this.props.isPhoneVerified && this.props.isEmailVerified;
  }

  toPlainObject(): UserEntityProps {
    return {
      ...this.props,
      availableRoles: [...this.props.availableRoles],
    };
  }
}