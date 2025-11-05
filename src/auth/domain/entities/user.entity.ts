import { UserRole } from '@prisma/client';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import { Password } from '../value-objects/password.vo';

export interface UserProps {
  id: string;
  email?: Email;
  phone?: Phone;
  firstName: string;
  lastName: string;
  password: Password;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email | undefined {
    return this.props.email;
  }

  get phone(): Phone | undefined {
    return this.props.phone;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get password(): Password {
    return this.props.password;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get isPhoneVerified(): boolean {
    return this.props.isPhoneVerified;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.updatedAt = new Date();
  }

  verifyPhone(): void {
    this.props.isPhoneVerified = true;
    this.props.updatedAt = new Date();
  }

  updatePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  updateProfile(firstName: string, lastName: string): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.props.updatedAt = new Date();
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return this.props.password.compare(plainPassword);
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email?.getValue(),
      phone: this.phone?.getValue(),
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
