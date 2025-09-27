export interface VendorDetailsProps {
  businessName: string;
  businessType: 'RESTAURANT' | 'GROCERY' | 'PHARMACY' | 'ELECTRONICS' | 'CLOTHING' | 'OTHER';
  businessRegistrationNumber?: string;
  taxId?: string;
  businessAddress: {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  contactInfo: {
    businessPhone: string;
    businessEmail: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  operatingHours: {
    monday?: { start: string; end: string; isOpen: boolean };
    tuesday?: { start: string; end: string; isOpen: boolean };
    wednesday?: { start: string; end: string; isOpen: boolean };
    thursday?: { start: string; end: string; isOpen: boolean };
    friday?: { start: string; end: string; isOpen: boolean };
    saturday?: { start: string; end: string; isOpen: boolean };
    sunday?: { start: string; end: string; isOpen: boolean };
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  businessDocuments?: {
    businessLicense?: string; // URL or file path
    taxCertificate?: string;
    healthPermit?: string;
    insuranceCertificate?: string;
  };
  deliverySettings: {
    deliveryRadius: number; // in kilometers
    minimumOrderValue: number;
    deliveryFee: number;
    freeDeliveryThreshold?: number;
    estimatedPreparationTime: number; // in minutes
    acceptsScheduledOrders: boolean;
  };
  paymentSettings: {
    acceptsCash: boolean;
    acceptsCard: boolean;
    acceptsDigitalWallet: boolean;
    commissionRate: number; // percentage
  };
  verificationStatus: {
    documentsVerified: boolean;
    businessVerified: boolean;
    bankDetailsVerified: boolean;
    isApproved: boolean;
  };
  businessMetrics?: {
    averagePreparationTime: number;
    orderAcceptanceRate: number;
    customerSatisfactionScore: number;
  };
  isActive: boolean;
  isFeatured: boolean;
}

export class VendorDetails {
  private constructor(private readonly props: VendorDetailsProps) {}

  static create(props: VendorDetailsProps): VendorDetails {
    const details = new VendorDetails(props);
    details.validate();
    return details;
  }

  // Getters
  get businessName(): string {
    return this.props.businessName;
  }

  get businessType(): VendorDetailsProps['businessType'] {
    return this.props.businessType;
  }

  get businessRegistrationNumber(): string | undefined {
    return this.props.businessRegistrationNumber;
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  get businessAddress(): VendorDetailsProps['businessAddress'] {
    return this.props.businessAddress;
  }

  get contactInfo(): VendorDetailsProps['contactInfo'] {
    return this.props.contactInfo;
  }

  get operatingHours(): VendorDetailsProps['operatingHours'] {
    return this.props.operatingHours;
  }

  get bankDetails(): VendorDetailsProps['bankDetails'] {
    return this.props.bankDetails;
  }

  get businessDocuments(): VendorDetailsProps['businessDocuments'] {
    return this.props.businessDocuments;
  }

  get deliverySettings(): VendorDetailsProps['deliverySettings'] {
    return this.props.deliverySettings;
  }

  get paymentSettings(): VendorDetailsProps['paymentSettings'] {
    return this.props.paymentSettings;
  }

  get verificationStatus(): VendorDetailsProps['verificationStatus'] {
    return this.props.verificationStatus;
  }

  get businessMetrics(): VendorDetailsProps['businessMetrics'] {
    return this.props.businessMetrics;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  // Update methods
  updateBusinessInfo(updates: Partial<Pick<VendorDetailsProps, 
    'businessName' | 'businessType' | 'businessRegistrationNumber' | 'taxId'>>): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      ...updates
    });
  }

  updateBusinessAddress(address: VendorDetailsProps['businessAddress']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      businessAddress: address
    });
  }

  updateContactInfo(contactInfo: VendorDetailsProps['contactInfo']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      contactInfo
    });
  }

  updateOperatingHours(operatingHours: VendorDetailsProps['operatingHours']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      operatingHours
    });
  }

  updateBankDetails(bankDetails: VendorDetailsProps['bankDetails']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      bankDetails
    });
  }

  updateBusinessDocuments(documents: VendorDetailsProps['businessDocuments']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      businessDocuments: {
        ...this.props.businessDocuments,
        ...documents
      }
    });
  }

  updateDeliverySettings(settings: Partial<VendorDetailsProps['deliverySettings']>): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      deliverySettings: {
        ...this.props.deliverySettings,
        ...settings
      }
    });
  }

  updatePaymentSettings(settings: Partial<VendorDetailsProps['paymentSettings']>): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      paymentSettings: {
        ...this.props.paymentSettings,
        ...settings
      }
    });
  }

  updateVerificationStatus(updates: Partial<VendorDetailsProps['verificationStatus']>): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      verificationStatus: {
        ...this.props.verificationStatus,
        ...updates
      }
    });
  }

  updateBusinessMetrics(metrics: VendorDetailsProps['businessMetrics']): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      businessMetrics: metrics
    });
  }

  // Business logic methods
  activate(): VendorDetails {
    if (!this.isFullyVerified()) {
      throw new Error('Vendor must be fully verified to activate');
    }

    return VendorDetails.create({
      ...this.props,
      isActive: true
    });
  }

  deactivate(): VendorDetails {
    return VendorDetails.create({
      ...this.props,
      isActive: false
    });
  }

  setFeatured(featured: boolean): VendorDetails {
    if (featured && !this.props.isActive) {
      throw new Error('Cannot feature inactive vendor');
    }

    return VendorDetails.create({
      ...this.props,
      isFeatured: featured
    });
  }

  completeDocumentVerification(): VendorDetails {
    return this.updateVerificationStatus({ documentsVerified: true });
  }

  completeBusinessVerification(): VendorDetails {
    return this.updateVerificationStatus({ businessVerified: true });
  }

  completeBankVerification(): VendorDetails {
    return this.updateVerificationStatus({ bankDetailsVerified: true });
  }

  approve(): VendorDetails {
    if (!this.canBeApproved()) {
      throw new Error('Vendor cannot be approved. Missing required verifications.');
    }

    return this.updateVerificationStatus({ isApproved: true });
  }

  updateLocation(latitude: number, longitude: number): VendorDetails {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    return VendorDetails.create({
      ...this.props,
      businessAddress: {
        ...this.props.businessAddress,
        latitude,
        longitude
      }
    });
  }

  // Helper methods
  isFullyVerified(): boolean {
    const status = this.props.verificationStatus;
    return status.documentsVerified && 
           status.businessVerified && 
           status.bankDetailsVerified && 
           status.isApproved;
  }

  canBeApproved(): boolean {
    const status = this.props.verificationStatus;
    return status.documentsVerified && 
           status.businessVerified && 
           status.bankDetailsVerified;
  }

  isOpenToday(): boolean {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()] as keyof VendorDetailsProps['operatingHours'];
    
    const todaySchedule = this.props.operatingHours[todayName];
    return todaySchedule?.isOpen || false;
  }

  isCurrentlyOpen(): boolean {
    if (!this.isOpenToday()) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[now.getDay()] as keyof VendorDetailsProps['operatingHours'];
    const todaySchedule = this.props.operatingHours[todayName];
    
    if (!todaySchedule || !todaySchedule.isOpen) return false;
    
    const [startHour, startMin] = todaySchedule.start.split(':').map(Number);
    const [endHour, endMin] = todaySchedule.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  canAcceptOrders(): boolean {
    return this.props.isActive && 
           this.isFullyVerified() && 
           this.isCurrentlyOpen();
  }

  canDeliverTo(distance: number): boolean {
    return distance <= this.props.deliverySettings.deliveryRadius;
  }

  meetsMinimumOrder(orderValue: number): boolean {
    return orderValue >= this.props.deliverySettings.minimumOrderValue;
  }

  qualifiesForFreeDelivery(orderValue: number): boolean {
    const threshold = this.props.deliverySettings.freeDeliveryThreshold;
    return threshold !== undefined && orderValue >= threshold;
  }

  calculateDeliveryFee(orderValue: number): number {
    if (this.qualifiesForFreeDelivery(orderValue)) {
      return 0;
    }
    return this.props.deliverySettings.deliveryFee;
  }

  getEstimatedDeliveryTime(): number {
    // Base preparation time + estimated delivery time (could be calculated based on distance)
    return this.props.deliverySettings.estimatedPreparationTime + 30; // +30 minutes for delivery
  }

  acceptsPaymentMethod(method: 'CASH' | 'CARD' | 'DIGITAL_WALLET'): boolean {
    switch (method) {
      case 'CASH':
        return this.props.paymentSettings.acceptsCash;
      case 'CARD':
        return this.props.paymentSettings.acceptsCard;
      case 'DIGITAL_WALLET':
        return this.props.paymentSettings.acceptsDigitalWallet;
      default:
        return false;
    }
  }

  calculateCommission(orderValue: number): number {
    return (orderValue * this.props.paymentSettings.commissionRate) / 100;
  }

  getBusinessFullAddress(): string {
    const addr = this.props.businessAddress;
    return [addr.address, addr.city, addr.state, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(', ');
  }

  hasLocation(): boolean {
    return this.props.businessAddress.latitude !== undefined && 
           this.props.businessAddress.longitude !== undefined;
  }

  hasRequiredDocuments(): boolean {
    const docs = this.props.businessDocuments;
    return !!(docs?.businessLicense && docs?.taxCertificate);
  }

  getOperatingDays(): string[] {
    const days: string[] = [];
    Object.entries(this.props.operatingHours).forEach(([day, schedule]) => {
      if (schedule?.isOpen) {
        days.push(day);
      }
    });
    return days;
  }

  getAverageRating(): number {
    return this.props.businessMetrics?.customerSatisfactionScore || 0;
  }

  getPerformanceScore(): number {
    const metrics = this.props.businessMetrics;
    if (!metrics) return 0;
    
    // Calculate a composite score based on various metrics
    const acceptanceScore = metrics.orderAcceptanceRate;
    const satisfactionScore = metrics.customerSatisfactionScore;
    const timeScore = Math.max(0, 100 - (metrics.averagePreparationTime - this.props.deliverySettings.estimatedPreparationTime));
    
    return (acceptanceScore + satisfactionScore + timeScore) / 3;
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    if (!this.props.businessName?.trim()) {
      errors.push('Business name is required');
    }

    if (!this.props.businessAddress?.address?.trim()) {
      errors.push('Business address is required');
    }

    if (!this.props.businessAddress?.city?.trim()) {
      errors.push('Business city is required');
    }

    if (!this.props.contactInfo?.businessPhone?.trim()) {
      errors.push('Business phone is required');
    }

    if (!this.props.contactInfo?.businessEmail?.trim()) {
      errors.push('Business email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.props.contactInfo?.businessEmail && !emailRegex.test(this.props.contactInfo.businessEmail)) {
      errors.push('Invalid business email format');
    }

    // Validate delivery settings
    if (this.props.deliverySettings.deliveryRadius <= 0) {
      errors.push('Delivery radius must be greater than 0');
    }

    if (this.props.deliverySettings.minimumOrderValue < 0) {
      errors.push('Minimum order value cannot be negative');
    }

    if (this.props.deliverySettings.deliveryFee < 0) {
      errors.push('Delivery fee cannot be negative');
    }

    if (this.props.deliverySettings.estimatedPreparationTime <= 0) {
      errors.push('Estimated preparation time must be greater than 0');
    }

    // Validate payment settings
    if (this.props.paymentSettings.commissionRate < 0 || this.props.paymentSettings.commissionRate > 100) {
      errors.push('Commission rate must be between 0 and 100');
    }

    // Validate operating hours format
    Object.entries(this.props.operatingHours).forEach(([day, schedule]) => {
      if (schedule && schedule.isOpen) {
        if (!this.isValidTimeFormat(schedule.start) || !this.isValidTimeFormat(schedule.end)) {
          errors.push(`Invalid time format for ${day}`);
        }
      }
    });

    // Validate location coordinates
    if (this.props.businessAddress.latitude !== undefined) {
      if (this.props.businessAddress.latitude < -90 || this.props.businessAddress.latitude > 90) {
        errors.push('Invalid latitude in business address');
      }
    }

    if (this.props.businessAddress.longitude !== undefined) {
      if (this.props.businessAddress.longitude < -180 || this.props.businessAddress.longitude > 180) {
        errors.push('Invalid longitude in business address');
      }
    }

    // Validate website URL if provided
    if (this.props.contactInfo.website && !this.isValidUrl(this.props.contactInfo.website)) {
      errors.push('Invalid website URL format');
    }

    if (errors.length > 0) {
      throw new Error(`Vendor details validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  toPlainObject(): VendorDetailsProps {
    return JSON.parse(JSON.stringify(this.props));
  }

  equals(other: VendorDetails): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }
}