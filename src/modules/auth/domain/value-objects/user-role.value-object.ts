import { BadRequestException } from '@nestjs/common';

export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}

export class UserRole {
  private readonly _value: UserRoleEnum;

  constructor(value: string | UserRoleEnum) {
    this.validate(value);
    this._value = typeof value === 'string' ? UserRoleEnum[value as keyof typeof UserRoleEnum] : value;
  }

  get value(): UserRoleEnum {
    return this._value;
  }

  private validate(role: string | UserRoleEnum): void {
    const roleValue = typeof role === 'string' ? role.toUpperCase() : role;
    
    if (!Object.values(UserRoleEnum).includes(roleValue as UserRoleEnum)) {
      throw new BadRequestException(`Invalid user role: ${role}. Valid roles are: ${Object.values(UserRoleEnum).join(', ')}`);
    }
  }

  isAdmin(): boolean {
    return this._value === UserRoleEnum.ADMIN;
  }

  isDriver(): boolean {
    return this._value === UserRoleEnum.DRIVER;
  }

  isCustomer(): boolean {
    return this._value === UserRoleEnum.CUSTOMER;
  }

  isVendor(): boolean {
    return this._value === UserRoleEnum.VENDOR;
  }

  hasPermission(requiredRole: UserRoleEnum): boolean {
    // Admin has all permissions
    if (this._value === UserRoleEnum.ADMIN) {
      return true;
    }

    // Exact role match
    return this._value === requiredRole;
  }

  canManageUsers(): boolean {
    return this._value === UserRoleEnum.ADMIN;
  }

  canManageOrders(): boolean {
    return this._value === UserRoleEnum.ADMIN || this._value === UserRoleEnum.VENDOR;
  }

  canDeliverOrders(): boolean {
    return this._value === UserRoleEnum.DRIVER;
  }

  equals(other: UserRole): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string | UserRoleEnum): UserRole {
    return new UserRole(value);
  }

  static admin(): UserRole {
    return new UserRole(UserRoleEnum.ADMIN);
  }

  static driver(): UserRole {
    return new UserRole(UserRoleEnum.DRIVER);
  }

  static customer(): UserRole {
    return new UserRole(UserRoleEnum.CUSTOMER);
  }

  static vendor(): UserRole {
    return new UserRole(UserRoleEnum.VENDOR);
  }
}