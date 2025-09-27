import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { VehicleInfo } from '../value-objects/vehicle-info.vo';
import { DocumentStatus } from '../value-objects/document-status.vo';

export type VehicleType = 'motorcycle' | 'bicycle' | 'car' | 'van' | 'truck';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'retired';
export type MaintenanceType = 'routine' | 'repair' | 'inspection' | 'emergency';

export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  currency: string;
  performedAt: Date;
  performedBy: string; // mechanic/service center
  nextDueDate?: Date;
  mileage?: number;
  receipts: string[]; // URLs to receipt images
  notes?: string;
}

export interface VehicleProps {
  riderId: string;
  vehicleInfo: VehicleInfo;
  status: VehicleStatus;
  documents: DocumentStatus[];
  maintenanceRecords: MaintenanceRecord[];
  currentMileage: number;
  lastInspectionDate?: Date;
  nextInspectionDue?: Date;
  insuranceExpiryDate?: Date;
  registrationExpiryDate?: Date;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Vehicle extends Entity<VehicleProps> {
  private constructor(props: VehicleProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: VehicleProps, id?: UniqueEntityID): Vehicle {
    return new Vehicle(props, id);
  }

  get vehicleId(): UniqueEntityID {
    return this._id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get vehicleInfo(): VehicleInfo {
    return this.props.vehicleInfo;
  }

  get status(): VehicleStatus {
    return this.props.status;
  }

  get documents(): DocumentStatus[] {
    return this.props.documents;
  }

  get maintenanceRecords(): MaintenanceRecord[] {
    return this.props.maintenanceRecords;
  }

  get currentMileage(): number {
    return this.props.currentMileage;
  }

  get lastInspectionDate(): Date | undefined {
    return this.props.lastInspectionDate;
  }

  get nextInspectionDue(): Date | undefined {
    return this.props.nextInspectionDue;
  }

  get insuranceExpiryDate(): Date | undefined {
    return this.props.insuranceExpiryDate;
  }

  get registrationExpiryDate(): Date | undefined {
    return this.props.registrationExpiryDate;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public updateVehicleInfo(vehicleInfo: VehicleInfo): void {
    this.props.vehicleInfo = vehicleInfo;
    this.props.updatedAt = new Date();
  }

  public updateStatus(status: VehicleStatus): void {
    this.props.status = status;
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
      // Update document logic would go here
      this.props.updatedAt = new Date();
    }
  }

  public addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): void {
    const maintenanceRecord: MaintenanceRecord = {
      ...record,
      id: new UniqueEntityID().toString(),
    };
    
    this.props.maintenanceRecords.push(maintenanceRecord);
    this.props.updatedAt = new Date();
  }

  public updateMileage(mileage: number): void {
    if (mileage < this.props.currentMileage) {
      throw new Error('New mileage cannot be less than current mileage');
    }
    
    this.props.currentMileage = mileage;
    this.props.updatedAt = new Date();
  }

  public scheduleInspection(dueDate: Date): void {
    this.props.nextInspectionDue = dueDate;
    this.props.updatedAt = new Date();
  }

  public completeInspection(inspectionDate: Date, nextDueDate?: Date): void {
    this.props.lastInspectionDate = inspectionDate;
    if (nextDueDate) {
      this.props.nextInspectionDue = nextDueDate;
    }
    this.props.updatedAt = new Date();
  }

  public updateInsuranceExpiry(expiryDate: Date): void {
    this.props.insuranceExpiryDate = expiryDate;
    this.props.updatedAt = new Date();
  }

  public updateRegistrationExpiry(expiryDate: Date): void {
    this.props.registrationExpiryDate = expiryDate;
    this.props.updatedAt = new Date();
  }

  public verify(verifiedBy: string): void {
    if (!this.hasRequiredDocuments()) {
      throw new Error('Cannot verify vehicle without required documents');
    }
    
    this.props.isVerified = true;
    this.props.verifiedAt = new Date();
    this.props.verifiedBy = verifiedBy;
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  public unverify(): void {
    this.props.isVerified = false;
    this.props.verifiedAt = undefined;
    this.props.verifiedBy = undefined;
    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
  }

  public addNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  public setMaintenance(): void {
    this.props.status = 'maintenance';
    this.props.updatedAt = new Date();
  }

  public setActive(): void {
    if (!this.props.isVerified) {
      throw new Error('Cannot activate unverified vehicle');
    }
    
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  public retire(): void {
    this.props.status = 'retired';
    this.props.updatedAt = new Date();
  }

  // Helper methods

  public hasRequiredDocuments(): boolean {
    const requiredDocTypes = ['registration', 'insurance'];
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

  public isInsuranceExpired(): boolean {
    if (!this.props.insuranceExpiryDate) return false;
    return new Date() > this.props.insuranceExpiryDate;
  }

  public isRegistrationExpired(): boolean {
    if (!this.props.registrationExpiryDate) return false;
    return new Date() > this.props.registrationExpiryDate;
  }

  public isInspectionDue(): boolean {
    if (!this.props.nextInspectionDue) return false;
    return new Date() >= this.props.nextInspectionDue;
  }

  public getDaysUntilInsuranceExpiry(): number | null {
    if (!this.props.insuranceExpiryDate) return null;
    
    const now = new Date();
    const diffTime = this.props.insuranceExpiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDaysUntilRegistrationExpiry(): number | null {
    if (!this.props.registrationExpiryDate) return null;
    
    const now = new Date();
    const diffTime = this.props.registrationExpiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDaysUntilInspection(): number | null {
    if (!this.props.nextInspectionDue) return null;
    
    const now = new Date();
    const diffTime = this.props.nextInspectionDue.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getMaintenanceCostThisYear(): number {
    const currentYear = new Date().getFullYear();
    return this.props.maintenanceRecords
      .filter(record => record.performedAt.getFullYear() === currentYear)
      .reduce((total, record) => total + record.cost, 0);
  }

  public getLastMaintenanceRecord(): MaintenanceRecord | undefined {
    if (this.props.maintenanceRecords.length === 0) return undefined;
    
    return this.props.maintenanceRecords
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];
  }

  public getMaintenanceRecordsByType(type: MaintenanceType): MaintenanceRecord[] {
    return this.props.maintenanceRecords.filter(record => record.type === type);
  }

  public needsRoutineMaintenance(intervalDays: number = 90): boolean {
    const lastRoutineMaintenance = this.getMaintenanceRecordsByType('routine')
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0];
    
    if (!lastRoutineMaintenance) return true;
    
    const daysSinceLastMaintenance = Math.floor(
      (Date.now() - lastRoutineMaintenance.performedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastMaintenance >= intervalDays;
  }

  public canBeUsedForDelivery(): boolean {
    return (
      this.props.status === 'active' &&
      this.props.isVerified &&
      !this.isInsuranceExpired() &&
      !this.isRegistrationExpired() &&
      this.hasRequiredDocuments()
    );
  }

  public getVehicleAge(): number {
    const currentYear = new Date().getFullYear();
    return currentYear - this.props.vehicleInfo.year;
  }

  public getVehicleConditionScore(): number {
    let score = 100;
    
    // Deduct points for age
    const age = this.getVehicleAge();
    score -= Math.min(age * 2, 20); // Max 20 points for age
    
    // Deduct points for expired documents
    const expiredDocs = this.getExpiredDocuments();
    score -= expiredDocs.length * 10;
    
    // Deduct points if inspection is overdue
    if (this.isInspectionDue()) {
      score -= 15;
    }
    
    // Deduct points if maintenance is overdue
    if (this.needsRoutineMaintenance()) {
      score -= 10;
    }
    
    return Math.max(score, 0);
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      riderId: this.props.riderId,
      vehicleInfo: this.props.vehicleInfo.toJSON(),
      status: this.props.status,
      documents: this.props.documents.map(doc => doc.toJSON()),
      maintenanceRecords: this.props.maintenanceRecords,
      currentMileage: this.props.currentMileage,
      lastInspectionDate: this.props.lastInspectionDate,
      nextInspectionDue: this.props.nextInspectionDue,
      insuranceExpiryDate: this.props.insuranceExpiryDate,
      registrationExpiryDate: this.props.registrationExpiryDate,
      isVerified: this.props.isVerified,
      verifiedAt: this.props.verifiedAt,
      verifiedBy: this.props.verifiedBy,
      notes: this.props.notes,
      age: this.getVehicleAge(),
      conditionScore: this.getVehicleConditionScore(),
      canBeUsedForDelivery: this.canBeUsedForDelivery(),
      isInsuranceExpired: this.isInsuranceExpired(),
      isRegistrationExpired: this.isRegistrationExpired(),
      isInspectionDue: this.isInspectionDue(),
      daysUntilInsuranceExpiry: this.getDaysUntilInsuranceExpiry(),
      daysUntilRegistrationExpiry: this.getDaysUntilRegistrationExpiry(),
      daysUntilInspection: this.getDaysUntilInspection(),
      maintenanceCostThisYear: this.getMaintenanceCostThisYear(),
      needsRoutineMaintenance: this.needsRoutineMaintenance(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}