import { AddressType } from '@prisma/client';

export interface AddressEntityProps {
  id: string;
  userId: string;
  type: AddressType;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  floorNumber?: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount?: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressEntity {
  private constructor(private readonly props: AddressEntityProps) {}

  static create(props: Omit<AddressEntityProps, 'id' | 'createdAt' | 'updatedAt'>): AddressEntity {
    const now = new Date();
    return new AddressEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: AddressEntityProps): AddressEntity {
    return new AddressEntity(props);
  }

  // Getters
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

  get addressLine1(): string {
    return this.props.addressLine1;
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get postalCode(): string {
    return this.props.postalCode;
  }

  get country(): string {
    return this.props.country;
  }

  get landmark(): string | undefined {
    return this.props.landmark;
  }

  get deliveryInstructions(): string | undefined {
    return this.props.deliveryInstructions;
  }

  get accessCode(): string | undefined {
    return this.props.accessCode;
  }

  get floorNumber(): string | undefined {
    return this.props.floorNumber;
  }

  get contactName(): string | undefined {
    return this.props.contactName;
  }

  get contactPhone(): string | undefined {
    return this.props.contactPhone;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get usageCount(): number | undefined {
    return this.props.usageCount;
  }

  get lastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  updateAddress(updates: Partial<Pick<AddressEntityProps, 
    'addressLine1' | 'addressLine2' | 'city' | 'state' | 'postalCode' | 'country' | 'landmark' | 'deliveryInstructions' | 'accessCode' | 'floorNumber'>>): void {
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();
  }

  updateContactInfo(contactName?: string, contactPhone?: string): void {
    if (contactName !== undefined) {
      this.props.contactName = contactName;
    }
    if (contactPhone !== undefined) {
      this.props.contactPhone = contactPhone;
    }
    this.props.updatedAt = new Date();
  }

  updateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
    
    this.props.latitude = latitude;
    this.props.longitude = longitude;
    this.props.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  unsetAsDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.props.isDefault) {
      throw new Error('Cannot deactivate default address. Set another address as default first.');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateLabel(label: string): void {
    this.props.label = label;
    this.props.updatedAt = new Date();
  }

  updateType(type: AddressType): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }

  // Helper methods
  getFullAddress(): string {
    const parts = [
      this.props.address,
      this.props.city,
      this.props.state,
      this.props.postalCode,
      this.props.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  getDisplayName(): string {
    if (this.props.label) {
      return this.props.label;
    }
    
    // Generate a display name based on type and address
    const typeLabel = this.props.type.toLowerCase().replace('_', ' ');
    const shortAddress = this.props.address.length > 30 
      ? this.props.address.substring(0, 30) + '...'
      : this.props.address;
    
    return `${typeLabel} - ${shortAddress}`;
  }

  hasCoordinates(): boolean {
    return this.props.latitude !== undefined && this.props.longitude !== undefined;
  }

  hasContactInfo(): boolean {
    return this.props.contactName !== undefined || this.props.contactPhone !== undefined;
  }

  isComplete(): boolean {
    return !!
      this.props.address &&
      this.props.city &&
      this.props.state &&
      this.props.postalCode &&
      this.props.country;
  }

  // Calculate distance to another address (if both have coordinates)
  distanceTo(otherAddress: AddressEntity): number | null {
    if (!this.hasCoordinates() || !otherAddress.hasCoordinates()) {
      return null;
    }

    const lat1 = this.props.latitude!;
    const lon1 = this.props.longitude!;
    const lat2 = otherAddress.latitude!;
    const lon2 = otherAddress.longitude!;

    // Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Validation methods
  validatePostalCode(): boolean {
    // Basic postal code validation - can be enhanced based on country
    const postalCodeRegex = /^[A-Za-z0-9\s-]{3,10}$/;
    return postalCodeRegex.test(this.props.postalCode);
  }

  validatePhoneNumber(): boolean {
    if (!this.props.contactPhone) return true; // Optional field
    
    // Basic phone number validation
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return phoneRegex.test(this.props.contactPhone.replace(/[\s()-]/g, ''));
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.props.address?.trim()) {
      errors.push('Address is required');
    }

    if (!this.props.city?.trim()) {
      errors.push('City is required');
    }

    if (!this.props.state?.trim()) {
      errors.push('State is required');
    }

    if (!this.props.postalCode?.trim()) {
      errors.push('Postal code is required');
    } else if (!this.validatePostalCode()) {
      errors.push('Invalid postal code format');
    }

    if (!this.props.country?.trim()) {
      errors.push('Country is required');
    }

    if (!this.validatePhoneNumber()) {
      errors.push('Invalid contact phone number format');
    }

    if (this.props.latitude !== undefined && (this.props.latitude < -90 || this.props.latitude > 90)) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }

    if (this.props.longitude !== undefined && (this.props.longitude < -180 || this.props.longitude > 180)) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toPlainObject(): AddressEntityProps {
    return { ...this.props };
  }
}