import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Email, Password, UserRole, Phone } from '../value-objects';
import { DomainEvent } from '../events/domain-event.base';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { PasswordChangedEvent } from '../events/password-changed.event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';

export interface UserProps {
  id?: string;
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  phone?: Phone;
  role: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  refreshTokens?: string[];
}

export class User {
  private _id: string;
  private _email: Email;
  private _password: Password;
  private _firstName: string;
  private _lastName: string;
  private _phone?: Phone;
  private _role: UserRole;
  private _isEmailVerified: boolean;
  private _isPhoneVerified: boolean;
  private _isActive: boolean;
  private _lastLoginAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _refreshTokens: string[];
  private _domainEvents: DomainEvent[] = [];

  constructor(props: UserProps) {
    this._id = props.id || this.generateId();
    this._email = props.email;
    this._password = props.password;
    this._firstName = this.validateName(props.firstName, 'First name');
    this._lastName = this.validateName(props.lastName, 'Last name');
    this._phone = props.phone;
    this._role = props.role;
    this._isEmailVerified = props.isEmailVerified ?? false;
    this._isPhoneVerified = props.isPhoneVerified ?? false;
    this._isActive = props.isActive ?? true;
    this._lastLoginAt = props.lastLoginAt;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._refreshTokens = props.refreshTokens || [];
  }

  // Getters
  get id(): string { return this._id; }
  get email(): Email { return this._email; }
  get password(): Password { return this._password; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get fullName(): string { return `${this._firstName} ${this._lastName}`; }
  get phone(): Phone | undefined { return this._phone; }
  get role(): UserRole { return this._role; }
  
  // Additional getter methods for compatibility
  getFirstName(): string { return this._firstName; }
  getLastName(): string { return this._lastName; }
  getRole(): UserRole { return this._role; }
  get isEmailVerified(): boolean { return this._isEmailVerified; }
  get isPhoneVerified(): boolean { return this._isPhoneVerified; }
  get isActive(): boolean { return this._isActive; }
  get lastLoginAt(): Date | undefined { return this._lastLoginAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get refreshTokens(): string[] { return [...this._refreshTokens]; }
  get domainEvents(): DomainEvent[] { return [...this._domainEvents]; }

  // Business Logic Methods
  static async create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = new User({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user.addDomainEvent(new UserRegisteredEvent({
      userId: user.id,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.value,
      occurredAt: new Date(),
    }));

    return user;
  }

  async changePassword(newPassword: Password): Promise<void> {
    if (this._password.equals(newPassword)) {
      throw new BadRequestException('New password must be different from current password');
    }

    this._password = newPassword;
    this._updatedAt = new Date();
    
    // Clear all refresh tokens when password changes
    this._refreshTokens = [];

    this.addDomainEvent(new PasswordChangedEvent({
      userId: this.id,
      occurredAt: new Date(),
    }));
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return this._password.compare(plainPassword);
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(new UserLoggedInEvent({
      userId: this.id,
      email: this.email.value,
      occurredAt: new Date(),
    }));
  }

  updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: Phone;
  }): void {
    let hasChanges = false;

    if (updates.firstName && updates.firstName !== this._firstName) {
      this._firstName = this.validateName(updates.firstName, 'First name');
      hasChanges = true;
    }

    if (updates.lastName && updates.lastName !== this._lastName) {
      this._lastName = this.validateName(updates.lastName, 'Last name');
      hasChanges = true;
    }

    if (updates.phone && (!this._phone || !updates.phone.equals(this._phone))) {
      this._phone = updates.phone;
      this._isPhoneVerified = false; // Reset verification when phone changes
      hasChanges = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();
      this.addDomainEvent(new UserProfileUpdatedEvent({
        userId: this.id,
        occurredAt: new Date(),
      }));
    }
  }

  verifyEmail(): void {
    if (this._isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    this._isEmailVerified = true;
    this._updatedAt = new Date();
  }

  verifyPhone(): void {
    if (!this._phone) {
      throw new BadRequestException('No phone number to verify');
    }
    if (this._isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }
    this._isPhoneVerified = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new BadRequestException('User is already deactivated');
    }
    this._isActive = false;
    this._refreshTokens = []; // Clear all tokens
    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._isActive) {
      throw new BadRequestException('User is already active');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  addRefreshToken(token: string): void {
    if (this._refreshTokens.includes(token)) {
      return; // Token already exists
    }
    this._refreshTokens.push(token);
    this._updatedAt = new Date();
  }

  removeRefreshToken(token: string): void {
    const index = this._refreshTokens.indexOf(token);
    if (index > -1) {
      this._refreshTokens.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  clearAllRefreshTokens(): void {
    this._refreshTokens = [];
    this._updatedAt = new Date();
  }

  hasRefreshToken(token: string): boolean {
    return this._refreshTokens.includes(token);
  }

  canPerformAction(requiredRole: UserRole): boolean {
    if (!this._isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }
    return this._role.hasPermission(requiredRole.value);
  }

  // Domain Events
  addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // Private helper methods
  private validateName(name: string, fieldName: string): string {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException(`${fieldName} cannot be empty`);
    }
    
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new BadRequestException(`${fieldName} must be at least 2 characters long`);
    }
    
    if (trimmedName.length > 50) {
      throw new BadRequestException(`${fieldName} cannot exceed 50 characters`);
    }
    
    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      throw new BadRequestException(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }
    
    return trimmedName;
  }

  private generateId(): string {
    // In production, use a proper UUID library
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Equality
  equals(other: User): boolean {
    return this._id === other._id;
  }

  // Serialization for persistence
  toPersistence(): any {
    return {
      id: this._id,
      email: this._email.value,
      password: this._password.hashedValue,
      firstName: this._firstName,
      lastName: this._lastName,
      phone: this._phone?.value,
      role: this._role.value,
      isEmailVerified: this._isEmailVerified,
      isPhoneVerified: this._isPhoneVerified,
      isActive: this._isActive,
      lastLoginAt: this._lastLoginAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      refreshTokens: this._refreshTokens,
    };
  }

  static fromPersistence(data: any): User {
    // Split the name field into firstName and lastName
    const nameParts = (data.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return new User({
      id: data.id,
      email: Email.create(data.email),
      password: Password.fromHash(data.password),
      firstName: firstName,
      lastName: lastName,
      phone: data.phone ? Phone.create(data.phone) : undefined,
      role: UserRole.create(data.role),
      isEmailVerified: data.isEmailVerified,
      isPhoneVerified: data.isPhoneVerified,
      isActive: data.isActive,
      lastLoginAt: data.lastLoginAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      refreshTokens: data.refreshTokens || [],
    });
  }
}