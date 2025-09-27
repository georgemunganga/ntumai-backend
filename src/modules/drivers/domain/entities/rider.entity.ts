import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { VehicleInfo } from '../value-objects/vehicle-info.vo';
import { Location } from '../value-objects/location.vo';
import { DocumentStatus } from '../value-objects/document-status.vo';
import { ShiftStatus } from '../value-objects/shift-status.vo';
import { RiderStatus } from '../value-objects/rider-status.vo';
import { EarningsDetails } from '../value-objects/earnings-details.vo';
import { PerformanceMetrics } from '../value-objects/performance-metrics.vo';

export interface RiderProps {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: Date;
  profilePicture?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  vehicleInfo?: VehicleInfo;
  currentLocation?: Location;
  homeAddress?: string;
  workingAreas: string[]; // Array of area/zone IDs
  documents: DocumentStatus[];
  shiftStatus: ShiftStatus;
  riderStatus: RiderStatus;
  earnings: EarningsDetails;
  performance: PerformanceMetrics;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  taxId?: string;
  preferredLanguage: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class Rider extends AggregateRoot<RiderProps> {
  private constructor(props: RiderProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: RiderProps, id?: UniqueEntityID): Rider {
    const rider = new Rider(props, id);
    
    // Domain events can be added here
    // rider.addDomainEvent(new RiderCreatedEvent(rider));
    
    return rider;
  }

  get riderId(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
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

  get email(): string {
    return this.props.email;
  }

  get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  get profilePicture(): string | undefined {
    return this.props.profilePicture;
  }

  get emergencyContactName(): string | undefined {
    return this.props.emergencyContactName;
  }

  get emergencyContactPhone(): string | undefined {
    return this.props.emergencyContactPhone;
  }

  get vehicleInfo(): VehicleInfo | undefined {
    return this.props.vehicleInfo;
  }

  get currentLocation(): Location | undefined {
    return this.props.currentLocation;
  }

  get homeAddress(): string | undefined {
    return this.props.homeAddress;
  }

  get workingAreas(): string[] {
    return this.props.workingAreas;
  }

  get documents(): DocumentStatus[] {
    return this.props.documents;
  }

  get shiftStatus(): ShiftStatus {
    return this.props.shiftStatus;
  }

  get riderStatus(): RiderStatus {
    return this.props.riderStatus;
  }

  get earnings(): EarningsDetails {
    return this.props.earnings;
  }

  get performance(): PerformanceMetrics {
    return this.props.performance;
  }

  get bankAccountNumber(): string | undefined {
    return this.props.bankAccountNumber;
  }

  get bankName(): string | undefined {
    return this.props.bankName;
  }

  get bankAccountHolderName(): string | undefined {
    return this.props.bankAccountHolderName;
  }

  get taxId(): string | undefined {
    return this.props.taxId;
  }

  get preferredLanguage(): string {
    return this.props.preferredLanguage;
  }

  get notificationPreferences() {
    return this.props.notificationPreferences;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  
  public updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    profilePicture?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    homeAddress?: string;
    preferredLanguage?: string;
  }): void {
    if (updates.firstName) this.props.firstName = updates.firstName;
    if (updates.lastName) this.props.lastName = updates.lastName;
    if (updates.phoneNumber) this.props.phoneNumber = updates.phoneNumber;
    if (updates.profilePicture) this.props.profilePicture = updates.profilePicture;
    if (updates.emergencyContactName) this.props.emergencyContactName = updates.emergencyContactName;
    if (updates.emergencyContactPhone) this.props.emergencyContactPhone = updates.emergencyContactPhone;
    if (updates.homeAddress) this.props.homeAddress = updates.homeAddress;
    if (updates.preferredLanguage) this.props.preferredLanguage = updates.preferredLanguage;
    
    this.props.updatedAt = new Date();
  }

  public updateVehicleInfo(vehicleInfo: VehicleInfo): void {
    this.props.vehicleInfo = vehicleInfo;
    this.props.updatedAt = new Date();
  }

  public updateLocation(location: Location): void {
    this.props.currentLocation = location;
    this.props.shiftStatus = this.props.shiftStatus.updateLastLocationUpdate();
    this.props.updatedAt = new Date();
  }

  public addWorkingArea(areaId: string): void {
    if (!this.props.workingAreas.includes(areaId)) {
      this.props.workingAreas.push(areaId);
      this.props.updatedAt = new Date();
    }
  }

  public removeWorkingArea(areaId: string): void {
    this.props.workingAreas = this.props.workingAreas.filter(id => id !== areaId);
    this.props.updatedAt = new Date();
  }

  public addDocument(document: DocumentStatus): void {
    // Remove existing document of same type
    this.props.documents = this.props.documents.filter(doc => doc.type !== document.type);
    this.props.documents.push(document);
    this.props.updatedAt = new Date();
  }

  public updateDocument(documentType: string, updates: Partial<DocumentStatus>): void {
    const documentIndex = this.props.documents.findIndex(doc => doc.type === documentType);
    if (documentIndex !== -1) {
      // Create updated document (assuming DocumentStatus has an update method)
      // This would need to be implemented in DocumentStatus value object
      this.props.updatedAt = new Date();
    }
  }

  public goOnline(): void {
    if (!this.canGoOnline()) {
      throw new Error('Rider cannot go online due to incomplete verification or suspended status');
    }
    
    this.props.shiftStatus = this.props.shiftStatus.goOnline();
    this.props.riderStatus = this.props.riderStatus.updateLastActive();
    this.props.updatedAt = new Date();
  }

  public goOffline(): void {
    this.props.shiftStatus = this.props.shiftStatus.goOffline();
    this.props.updatedAt = new Date();
  }

  public startBreak(breakType: 'lunch' | 'rest' | 'emergency'): void {
    this.props.shiftStatus = this.props.shiftStatus.startBreak(breakType);
    this.props.updatedAt = new Date();
  }

  public endBreak(): void {
    this.props.shiftStatus = this.props.shiftStatus.endBreak();
    this.props.updatedAt = new Date();
  }

  public setBusy(): void {
    this.props.shiftStatus = this.props.shiftStatus.setBusy();
    this.props.updatedAt = new Date();
  }

  public setAvailable(): void {
    this.props.shiftStatus = this.props.shiftStatus.setAvailable();
    this.props.updatedAt = new Date();
  }

  public updateEarnings(earnings: EarningsDetails): void {
    this.props.earnings = earnings;
    this.props.updatedAt = new Date();
  }

  public updatePerformance(performance: PerformanceMetrics): void {
    this.props.performance = performance;
    this.props.updatedAt = new Date();
  }

  public updateBankDetails(details: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  }): void {
    this.props.bankAccountNumber = details.accountNumber;
    this.props.bankName = details.bankName;
    this.props.bankAccountHolderName = details.accountHolderName;
    this.props.updatedAt = new Date();
  }

  public updateNotificationPreferences(preferences: Partial<typeof this.props.notificationPreferences>): void {
    this.props.notificationPreferences = {
      ...this.props.notificationPreferences,
      ...preferences,
    };
    this.props.updatedAt = new Date();
  }

  public suspend(reason: string): void {
    this.props.riderStatus = this.props.riderStatus.suspend(reason);
    this.props.shiftStatus = this.props.shiftStatus.goOffline();
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.riderStatus = this.props.riderStatus.activate();
    this.props.updatedAt = new Date();
  }

  public reject(reason: string): void {
    this.props.riderStatus = this.props.riderStatus.reject(reason);
    this.props.shiftStatus = this.props.shiftStatus.goOffline();
    this.props.updatedAt = new Date();
  }

  // Helper methods
  
  public canGoOnline(): boolean {
    return (
      this.props.riderStatus.isActive() &&
      this.props.riderStatus.isVerified() &&
      this.hasRequiredDocuments() &&
      this.props.vehicleInfo !== undefined
    );
  }

  public isOnline(): boolean {
    return this.props.shiftStatus.isOnline();
  }

  public isAvailableForOrders(): boolean {
    return (
      this.isOnline() &&
      this.props.shiftStatus.isAvailable() &&
      this.props.riderStatus.isActive()
    );
  }

  public hasRequiredDocuments(): boolean {
    const requiredDocTypes = ['drivers_license', 'vehicle_registration', 'insurance'];
    return requiredDocTypes.every(type => 
      this.props.documents.some(doc => doc.type === type && doc.isVerified())
    );
  }

  public getExpiredDocuments(): DocumentStatus[] {
    return this.props.documents.filter(doc => doc.isExpired());
  }

  public getDocumentsNeedingRenewal(daysAhead: number = 30): DocumentStatus[] {
    return this.props.documents.filter(doc => doc.needsRenewal(daysAhead));
  }

  public getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.props.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  public getWorkingHoursToday(): number {
    return this.props.shiftStatus.getTotalWorkingHours();
  }

  public canAcceptOrder(): boolean {
    return (
      this.isAvailableForOrders() &&
      !this.props.shiftStatus.isOnBreak() &&
      this.props.currentLocation !== undefined
    );
  }

  public getDistanceFromLocation(targetLocation: Location): number | null {
    if (!this.props.currentLocation) return null;
    return this.props.currentLocation.distanceTo(targetLocation);
  }

  public isInWorkingArea(areaId: string): boolean {
    return this.props.workingAreas.includes(areaId);
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      userId: this.props.userId,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      fullName: this.fullName,
      email: this.props.email,
      phoneNumber: this.props.phoneNumber,
      dateOfBirth: this.props.dateOfBirth,
      age: this.getAge(),
      profilePicture: this.props.profilePicture,
      emergencyContactName: this.props.emergencyContactName,
      emergencyContactPhone: this.props.emergencyContactPhone,
      vehicleInfo: this.props.vehicleInfo?.toJSON(),
      currentLocation: this.props.currentLocation?.toJSON(),
      homeAddress: this.props.homeAddress,
      workingAreas: this.props.workingAreas,
      documents: this.props.documents.map(doc => doc.toJSON()),
      shiftStatus: this.props.shiftStatus.toJSON(),
      riderStatus: this.props.riderStatus.toJSON(),
      earnings: this.props.earnings.toJSON(),
      performance: this.props.performance.toJSON(),
      bankAccountNumber: this.props.bankAccountNumber,
      bankName: this.props.bankName,
      bankAccountHolderName: this.props.bankAccountHolderName,
      taxId: this.props.taxId,
      preferredLanguage: this.props.preferredLanguage,
      notificationPreferences: this.props.notificationPreferences,
      canGoOnline: this.canGoOnline(),
      isOnline: this.isOnline(),
      isAvailableForOrders: this.isAvailableForOrders(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}