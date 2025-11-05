import { AddressType } from '@prisma/client';

export interface AddressProps {
  id: string;
  userId: string;
  type: AddressType;
  label?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  contactName?: string;
  contactPhone?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressEntity {
  private constructor(private readonly props: AddressProps) {}

  static create(
    props: Omit<AddressProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): AddressEntity {
    return new AddressEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: AddressProps): AddressEntity {
    return new AddressEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): AddressType {
    return this.props.type;
  }

  get label(): string | undefined {
    return this.props.label;
  }

  get address(): string {
    return this.props.address;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get country(): string {
    return this.props.country;
  }

  get postalCode(): string | undefined {
    return this.props.postalCode;
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get instructions(): string | undefined {
    return this.props.instructions;
  }

  get contactName(): string | undefined {
    return this.props.contactName;
  }

  get contactPhone(): string | undefined {
    return this.props.contactPhone;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  unsetDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  update(
    updates: Partial<Omit<AddressProps, 'id' | 'userId' | 'createdAt'>>,
  ): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  toPersistence(): AddressProps {
    return { ...this.props };
  }
}
