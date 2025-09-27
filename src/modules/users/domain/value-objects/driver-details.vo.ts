export interface DriverDetailsProps {
  licenseNumber: string;
  licenseExpiryDate: Date;
  vehicleType: 'MOTORCYCLE' | 'CAR' | 'VAN' | 'TRUCK' | 'BICYCLE';
  vehicleModel?: string;
  vehiclePlateNumber: string;
  vehicleColor?: string;
  vehicleYear?: number;
  insuranceNumber?: string;
  insuranceExpiryDate?: Date;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
    routingNumber?: string;
  };
  workingHours?: {
    monday?: { start: string; end: string; isActive: boolean };
    tuesday?: { start: string; end: string; isActive: boolean };
    wednesday?: { start: string; end: string; isActive: boolean };
    thursday?: { start: string; end: string; isActive: boolean };
    friday?: { start: string; end: string; isActive: boolean };
    saturday?: { start: string; end: string; isActive: boolean };
    sunday?: { start: string; end: string; isActive: boolean };
  };
  serviceAreas: string[]; // Array of city/area names
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  verificationStatus: {
    documentsVerified: boolean;
    backgroundCheckCompleted: boolean;
    trainingCompleted: boolean;
    isApproved: boolean;
  };
}

export class DriverDetails {
  private constructor(private readonly props: DriverDetailsProps) {}

  static create(props: DriverDetailsProps): DriverDetails {
    const details = new DriverDetails(props);
    details.validate();
    return details;
  }

  // Getters
  get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  get licenseExpiryDate(): Date {
    return this.props.licenseExpiryDate;
  }

  get vehicleType(): DriverDetailsProps['vehicleType'] {
    return this.props.vehicleType;
  }

  get vehicleModel(): string | undefined {
    return this.props.vehicleModel;
  }

  get vehiclePlateNumber(): string {
    return this.props.vehiclePlateNumber;
  }

  get vehicleColor(): string | undefined {
    return this.props.vehicleColor;
  }

  get vehicleYear(): number | undefined {
    return this.props.vehicleYear;
  }

  get insuranceNumber(): string | undefined {
    return this.props.insuranceNumber;
  }

  get insuranceExpiryDate(): Date | undefined {
    return this.props.insuranceExpiryDate;
  }

  get emergencyContact(): DriverDetailsProps['emergencyContact'] {
    return this.props.emergencyContact;
  }

  get bankDetails(): DriverDetailsProps['bankDetails'] {
    return this.props.bankDetails;
  }

  get workingHours(): DriverDetailsProps['workingHours'] {
    return this.props.workingHours;
  }

  get serviceAreas(): string[] {
    return [...this.props.serviceAreas];
  }

  get isAvailable(): boolean {
    return this.props.isAvailable;
  }

  get currentLocation(): DriverDetailsProps['currentLocation'] {
    return this.props.currentLocation;
  }

  get verificationStatus(): DriverDetailsProps['verificationStatus'] {
    return this.props.verificationStatus;
  }

  // Update methods
  updateLicense(licenseNumber: string, expiryDate: Date): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      licenseNumber,
      licenseExpiryDate: expiryDate
    });
  }

  updateVehicleInfo(updates: Partial<Pick<DriverDetailsProps, 
    'vehicleType' | 'vehicleModel' | 'vehiclePlateNumber' | 'vehicleColor' | 'vehicleYear'>>): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      ...updates
    });
  }

  updateInsurance(insuranceNumber: string, expiryDate: Date): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      insuranceNumber,
      insuranceExpiryDate: expiryDate
    });
  }

  updateEmergencyContact(emergencyContact: DriverDetailsProps['emergencyContact']): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      emergencyContact
    });
  }

  updateBankDetails(bankDetails: DriverDetailsProps['bankDetails']): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      bankDetails
    });
  }

  updateWorkingHours(workingHours: DriverDetailsProps['workingHours']): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      workingHours
    });
  }

  addServiceArea(area: string): DriverDetails {
    if (this.props.serviceAreas.includes(area)) {
      return this;
    }

    return DriverDetails.create({
      ...this.props,
      serviceAreas: [...this.props.serviceAreas, area]
    });
  }

  removeServiceArea(area: string): DriverDetails {
    const updatedAreas = this.props.serviceAreas.filter(a => a !== area);
    
    return DriverDetails.create({
      ...this.props,
      serviceAreas: updatedAreas
    });
  }

  setAvailability(isAvailable: boolean): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      isAvailable
    });
  }

  updateLocation(latitude: number, longitude: number): DriverDetails {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    return DriverDetails.create({
      ...this.props,
      currentLocation: {
        latitude,
        longitude,
        lastUpdated: new Date()
      }
    });
  }

  updateVerificationStatus(updates: Partial<DriverDetailsProps['verificationStatus']>): DriverDetails {
    return DriverDetails.create({
      ...this.props,
      verificationStatus: {
        ...this.props.verificationStatus,
        ...updates
      }
    });
  }

  // Business logic methods
  goOnline(): DriverDetails {
    if (!this.isFullyVerified()) {
      throw new Error('Driver must be fully verified to go online');
    }

    if (this.isLicenseExpired() || this.isInsuranceExpired()) {
      throw new Error('Cannot go online with expired documents');
    }

    return this.setAvailability(true);
  }

  goOffline(): DriverDetails {
    return this.setAvailability(false);
  }

  completeDocumentVerification(): DriverDetails {
    return this.updateVerificationStatus({ documentsVerified: true });
  }

  completeBackgroundCheck(): DriverDetails {
    return this.updateVerificationStatus({ backgroundCheckCompleted: true });
  }

  completeTraining(): DriverDetails {
    return this.updateVerificationStatus({ trainingCompleted: true });
  }

  approve(): DriverDetails {
    if (!this.canBeApproved()) {
      throw new Error('Driver cannot be approved. Missing required verifications.');
    }

    return this.updateVerificationStatus({ isApproved: true });
  }

  // Helper methods
  isFullyVerified(): boolean {
    const status = this.props.verificationStatus;
    return status.documentsVerified && 
           status.backgroundCheckCompleted && 
           status.trainingCompleted && 
           status.isApproved;
  }

  canBeApproved(): boolean {
    const status = this.props.verificationStatus;
    return status.documentsVerified && 
           status.backgroundCheckCompleted && 
           status.trainingCompleted;
  }

  isLicenseExpired(): boolean {
    return this.props.licenseExpiryDate < new Date();
  }

  isInsuranceExpired(): boolean {
    if (!this.props.insuranceExpiryDate) return false;
    return this.props.insuranceExpiryDate < new Date();
  }

  getDaysUntilLicenseExpiry(): number {
    const today = new Date();
    const diffTime = this.props.licenseExpiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilInsuranceExpiry(): number | null {
    if (!this.props.insuranceExpiryDate) return null;
    
    const today = new Date();
    const diffTime = this.props.insuranceExpiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isWorkingToday(): boolean {
    const today = new Date().toLocaleLowerCase();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()] as keyof DriverDetailsProps['workingHours'];
    
    const todaySchedule = this.props.workingHours?.[todayName];
    return todaySchedule?.isActive || false;
  }

  isCurrentlyInWorkingHours(): boolean {
    if (!this.isWorkingToday()) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[now.getDay()] as keyof DriverDetailsProps['workingHours'];
    const todaySchedule = this.props.workingHours?.[todayName];
    
    if (!todaySchedule) return false;
    
    const [startHour, startMin] = todaySchedule.start.split(':').map(Number);
    const [endHour, endMin] = todaySchedule.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  canAcceptDeliveries(): boolean {
    return this.props.isAvailable && 
           this.isFullyVerified() && 
           !this.isLicenseExpired() && 
           !this.isInsuranceExpired();
  }

  servesArea(area: string): boolean {
    return this.props.serviceAreas.includes(area);
  }

  hasCurrentLocation(): boolean {
    return !!this.props.currentLocation;
  }

  getLocationAge(): number | null {
    if (!this.props.currentLocation) return null;
    
    const now = new Date();
    const locationTime = this.props.currentLocation.lastUpdated;
    return now.getTime() - locationTime.getTime(); // milliseconds
  }

  isLocationStale(maxAgeMinutes: number = 5): boolean {
    const age = this.getLocationAge();
    if (age === null) return true;
    
    return age > (maxAgeMinutes * 60 * 1000);
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    if (!this.props.licenseNumber?.trim()) {
      errors.push('License number is required');
    }

    if (!this.props.vehiclePlateNumber?.trim()) {
      errors.push('Vehicle plate number is required');
    }

    if (this.props.licenseExpiryDate <= new Date()) {
      errors.push('License expiry date must be in the future');
    }

    if (this.props.insuranceExpiryDate && this.props.insuranceExpiryDate <= new Date()) {
      errors.push('Insurance expiry date must be in the future');
    }

    if (this.props.vehicleYear && (this.props.vehicleYear < 1900 || this.props.vehicleYear > new Date().getFullYear() + 1)) {
      errors.push('Invalid vehicle year');
    }

    if (!this.props.emergencyContact?.name?.trim()) {
      errors.push('Emergency contact name is required');
    }

    if (!this.props.emergencyContact?.phone?.trim()) {
      errors.push('Emergency contact phone is required');
    }

    if (this.props.serviceAreas.length === 0) {
      errors.push('At least one service area is required');
    }

    // Validate working hours format
    if (this.props.workingHours) {
      Object.entries(this.props.workingHours).forEach(([day, schedule]) => {
        if (schedule && schedule.isActive) {
          if (!this.isValidTimeFormat(schedule.start) || !this.isValidTimeFormat(schedule.end)) {
            errors.push(`Invalid time format for ${day}`);
          }
        }
      });
    }

    // Validate current location
    if (this.props.currentLocation) {
      const { latitude, longitude } = this.props.currentLocation;
      if (latitude < -90 || latitude > 90) {
        errors.push('Invalid latitude in current location');
      }
      if (longitude < -180 || longitude > 180) {
        errors.push('Invalid longitude in current location');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Driver details validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  toPlainObject(): DriverDetailsProps {
    return JSON.parse(JSON.stringify(this.props));
  }

  equals(other: DriverDetails): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }
}