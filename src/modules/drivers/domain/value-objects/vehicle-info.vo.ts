import { ValueObject } from '../../../common/domain/value-object';

export interface VehicleInfoProps {
  type: 'motorcycle' | 'bicycle' | 'car' | 'scooter';
  make: string;
  model: string;
  plateNumber: string;
  year: number;
  color: string;
  registrationNumber?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: Date;
  registrationExpiryDate?: Date;
}

export class VehicleInfo extends ValueObject<VehicleInfoProps> {
  private constructor(props: VehicleInfoProps) {
    super(props);
  }

  public static create(props: VehicleInfoProps): VehicleInfo {
    if (!props.type || !props.make || !props.model || !props.plateNumber) {
      throw new Error('Vehicle type, make, model, and plate number are required');
    }

    if (props.year < 1900 || props.year > new Date().getFullYear() + 1) {
      throw new Error('Invalid vehicle year');
    }

    if (props.plateNumber.length < 3 || props.plateNumber.length > 15) {
      throw new Error('Plate number must be between 3 and 15 characters');
    }

    return new VehicleInfo(props);
  }

  get type(): VehicleInfoProps['type'] {
    return this.props.type;
  }

  get make(): string {
    return this.props.make;
  }

  get model(): string {
    return this.props.model;
  }

  get plateNumber(): string {
    return this.props.plateNumber;
  }

  get year(): number {
    return this.props.year;
  }

  get color(): string {
    return this.props.color;
  }

  get registrationNumber(): string | undefined {
    return this.props.registrationNumber;
  }

  get insuranceNumber(): string | undefined {
    return this.props.insuranceNumber;
  }

  get insuranceExpiryDate(): Date | undefined {
    return this.props.insuranceExpiryDate;
  }

  get registrationExpiryDate(): Date | undefined {
    return this.props.registrationExpiryDate;
  }

  isInsuranceExpired(): boolean {
    if (!this.props.insuranceExpiryDate) return false;
    return this.props.insuranceExpiryDate < new Date();
  }

  isRegistrationExpired(): boolean {
    if (!this.props.registrationExpiryDate) return false;
    return this.props.registrationExpiryDate < new Date();
  }

  isValidForDelivery(): boolean {
    return !this.isInsuranceExpired() && !this.isRegistrationExpired();
  }

  updateInsurance(insuranceNumber: string, expiryDate: Date): VehicleInfo {
    return VehicleInfo.create({
      ...this.props,
      insuranceNumber,
      insuranceExpiryDate: expiryDate,
    });
  }

  updateRegistration(registrationNumber: string, expiryDate: Date): VehicleInfo {
    return VehicleInfo.create({
      ...this.props,
      registrationNumber,
      registrationExpiryDate: expiryDate,
    });
  }

  getDisplayName(): string {
    return `${this.props.year} ${this.props.make} ${this.props.model}`;
  }

  toJSON() {
    return {
      type: this.props.type,
      make: this.props.make,
      model: this.props.model,
      plateNumber: this.props.plateNumber,
      year: this.props.year,
      color: this.props.color,
      registrationNumber: this.props.registrationNumber,
      insuranceNumber: this.props.insuranceNumber,
      insuranceExpiryDate: this.props.insuranceExpiryDate,
      registrationExpiryDate: this.props.registrationExpiryDate,
    };
  }
}