import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export type IncidentType = 'accident' | 'theft' | 'harassment' | 'vehicle_breakdown' | 'customer_complaint' | 'safety_concern' | 'traffic_violation' | 'property_damage' | 'injury' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'under_investigation' | 'resolved' | 'closed' | 'escalated';
export type InjuryType = 'none' | 'minor' | 'moderate' | 'severe' | 'fatal';

export interface IncidentParty {
  id: string;
  type: 'rider' | 'customer' | 'third_party' | 'property_owner';
  name: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  insuranceInfo?: {
    company: string;
    policyNumber: string;
  };
  vehicleInfo?: {
    make: string;
    model: string;
    plateNumber: string;
    color: string;
  };
}

export interface IncidentEvidence {
  id: string;
  type: 'photo' | 'video' | 'document' | 'audio' | 'witness_statement';
  url: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface IncidentAction {
  id: string;
  type: 'investigation_started' | 'evidence_collected' | 'statement_taken' | 'insurance_contacted' | 'police_report_filed' | 'medical_attention' | 'vehicle_inspected' | 'resolved' | 'escalated' | 'closed';
  description: string;
  performedBy: string;
  performedAt: Date;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  insuranceCompany: string;
  policyNumber: string;
  claimAmount?: number;
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'settled';
  filedAt: Date;
  settledAt?: Date;
  settlementAmount?: number;
  notes?: string;
}

export interface PoliceReport {
  reportNumber: string;
  filedAt: Date;
  officerName?: string;
  stationName?: string;
  reportUrl?: string;
  charges?: string[];
}

export interface MedicalReport {
  id: string;
  hospitalName: string;
  doctorName?: string;
  injuryType: InjuryType;
  injuryDescription: string;
  treatmentProvided: string;
  medicalCost?: number;
  reportUrl?: string;
  reportedAt: Date;
}

export interface IncidentProps {
  riderId: string;
  orderId?: string;
  shiftId?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: Location;
  occurredAt: Date;
  reportedAt: Date;
  reportedBy: string;
  parties: IncidentParty[];
  evidence: IncidentEvidence[];
  actions: IncidentAction[];
  insuranceClaims: InsuranceClaim[];
  policeReport?: PoliceReport;
  medicalReports: MedicalReport[];
  estimatedDamage?: number;
  actualDamage?: number;
  isInsuranceCovered: boolean;
  requiresPoliceReport: boolean;
  requiresMedicalAttention: boolean;
  assignedInvestigator?: string;
  investigationNotes?: string;
  resolutionNotes?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  currency: string;
  tags: string[];
  priority: number; // 1-10, 10 being highest
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Incident extends Entity<IncidentProps> {
  private constructor(props: IncidentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: IncidentProps, id?: UniqueEntityID): Incident {
    const incident = new Incident(props, id);
    
    // Add initial action
    incident.addAction('investigation_started', 'Incident reported and investigation initiated', props.reportedBy);
    
    return incident;
  }

  get incidentId(): UniqueEntityID {
    return this._id;
  }

  get riderId(): string {
    return this.props.riderId;
  }

  get orderId(): string | undefined {
    return this.props.orderId;
  }

  get shiftId(): string | undefined {
    return this.props.shiftId;
  }

  get type(): IncidentType {
    return this.props.type;
  }

  get severity(): IncidentSeverity {
    return this.props.severity;
  }

  get status(): IncidentStatus {
    return this.props.status;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get location(): Location {
    return this.props.location;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }

  get reportedAt(): Date {
    return this.props.reportedAt;
  }

  get reportedBy(): string {
    return this.props.reportedBy;
  }

  get parties(): IncidentParty[] {
    return this.props.parties;
  }

  get evidence(): IncidentEvidence[] {
    return this.props.evidence;
  }

  get actions(): IncidentAction[] {
    return this.props.actions;
  }

  get insuranceClaims(): InsuranceClaim[] {
    return this.props.insuranceClaims;
  }

  get policeReport(): PoliceReport | undefined {
    return this.props.policeReport;
  }

  get medicalReports(): MedicalReport[] {
    return this.props.medicalReports;
  }

  get estimatedDamage(): number | undefined {
    return this.props.estimatedDamage;
  }

  get actualDamage(): number | undefined {
    return this.props.actualDamage;
  }

  get isInsuranceCovered(): boolean {
    return this.props.isInsuranceCovered;
  }

  get requiresPoliceReport(): boolean {
    return this.props.requiresPoliceReport;
  }

  get requiresMedicalAttention(): boolean {
    return this.props.requiresMedicalAttention;
  }

  get assignedInvestigator(): string | undefined {
    return this.props.assignedInvestigator;
  }

  get investigationNotes(): string | undefined {
    return this.props.investigationNotes;
  }

  get resolutionNotes(): string | undefined {
    return this.props.resolutionNotes;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  get currency(): string {
    return this.props.currency;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get priority(): number {
    return this.props.priority;
  }

  get followUpRequired(): boolean {
    return this.props.followUpRequired;
  }

  get followUpDate(): Date | undefined {
    return this.props.followUpDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods

  public updateStatus(status: IncidentStatus, notes?: string): void {
    const previousStatus = this.props.status;
    this.props.status = status;
    this.props.updatedAt = new Date();

    // Add action for status change
    const actionDescription = `Status changed from ${previousStatus} to ${status}`;
    this.addAction('investigation_started', actionDescription, 'system', notes);

    // Set timestamps based on status
    if (status === 'resolved' && !this.props.resolvedAt) {
      this.props.resolvedAt = new Date();
    }
    if (status === 'closed' && !this.props.closedAt) {
      this.props.closedAt = new Date();
    }
  }

  public updateSeverity(severity: IncidentSeverity): void {
    const previousSeverity = this.props.severity;
    this.props.severity = severity;
    this.props.updatedAt = new Date();

    // Adjust priority based on severity
    const severityPriorityMap: Record<IncidentSeverity, number> = {
      low: 3,
      medium: 5,
      high: 8,
      critical: 10,
    };
    this.props.priority = severityPriorityMap[severity];

    this.addAction('investigation_started', `Severity updated from ${previousSeverity} to ${severity}`, 'system');
  }

  public assignInvestigator(investigatorId: string, notes?: string): void {
    this.props.assignedInvestigator = investigatorId;
    this.props.updatedAt = new Date();

    this.addAction('investigation_started', `Assigned to investigator ${investigatorId}`, investigatorId, notes);
  }

  public addParty(party: Omit<IncidentParty, 'id'>): string {
    const newParty: IncidentParty = {
      id: new UniqueEntityID().toString(),
      ...party,
    };

    this.props.parties.push(newParty);
    this.props.updatedAt = new Date();

    this.addAction('statement_taken', `Added party: ${party.name} (${party.type})`, 'system');

    return newParty.id;
  }

  public updateParty(partyId: string, updates: Partial<Omit<IncidentParty, 'id'>>): void {
    const party = this.props.parties.find(p => p.id === partyId);
    if (!party) {
      throw new Error('Party not found');
    }

    Object.assign(party, updates);
    this.props.updatedAt = new Date();

    this.addAction('statement_taken', `Updated party information for ${party.name}`, 'system');
  }

  public addEvidence(evidence: Omit<IncidentEvidence, 'id' | 'uploadedAt'>, uploadedBy: string): string {
    const newEvidence: IncidentEvidence = {
      id: new UniqueEntityID().toString(),
      uploadedAt: new Date(),
      uploadedBy,
      ...evidence,
    };

    this.props.evidence.push(newEvidence);
    this.props.updatedAt = new Date();

    this.addAction('evidence_collected', `Added ${evidence.type}: ${evidence.description || 'No description'}`, uploadedBy);

    return newEvidence.id;
  }

  public removeEvidence(evidenceId: string): void {
    const evidenceIndex = this.props.evidence.findIndex(e => e.id === evidenceId);
    if (evidenceIndex === -1) {
      throw new Error('Evidence not found');
    }

    const evidence = this.props.evidence[evidenceIndex];
    this.props.evidence.splice(evidenceIndex, 1);
    this.props.updatedAt = new Date();

    this.addAction('evidence_collected', `Removed ${evidence.type}: ${evidence.description || 'No description'}`, 'system');
  }

  public addAction(type: IncidentAction['type'], description: string, performedBy: string, notes?: string): void {
    const action: IncidentAction = {
      id: new UniqueEntityID().toString(),
      type,
      description,
      performedBy,
      performedAt: new Date(),
      notes,
    };

    this.props.actions.push(action);
    this.props.updatedAt = new Date();
  }

  public addInsuranceClaim(claim: Omit<InsuranceClaim, 'id' | 'filedAt'>): string {
    const newClaim: InsuranceClaim = {
      id: new UniqueEntityID().toString(),
      filedAt: new Date(),
      ...claim,
    };

    this.props.insuranceClaims.push(newClaim);
    this.props.updatedAt = new Date();

    this.addAction('insurance_contacted', `Filed insurance claim ${claim.claimNumber} with ${claim.insuranceCompany}`, 'system');

    return newClaim.id;
  }

  public updateInsuranceClaim(claimId: string, updates: Partial<Omit<InsuranceClaim, 'id' | 'filedAt'>>): void {
    const claim = this.props.insuranceClaims.find(c => c.id === claimId);
    if (!claim) {
      throw new Error('Insurance claim not found');
    }

    Object.assign(claim, updates);
    this.props.updatedAt = new Date();

    this.addAction('insurance_contacted', `Updated insurance claim ${claim.claimNumber}`, 'system');
  }

  public addPoliceReport(report: PoliceReport): void {
    this.props.policeReport = report;
    this.props.updatedAt = new Date();

    this.addAction('police_report_filed', `Police report filed: ${report.reportNumber}`, 'system');
  }

  public addMedicalReport(report: Omit<MedicalReport, 'id'>): string {
    const newReport: MedicalReport = {
      id: new UniqueEntityID().toString(),
      ...report,
    };

    this.props.medicalReports.push(newReport);
    this.props.updatedAt = new Date();

    this.addAction('medical_attention', `Medical report added from ${report.hospitalName}`, 'system');

    return newReport.id;
  }

  public updateDamageEstimate(estimatedDamage: number): void {
    this.props.estimatedDamage = estimatedDamage;
    this.props.updatedAt = new Date();

    this.addAction('vehicle_inspected', `Damage estimated at ${this.formatAmount(estimatedDamage)}`, 'system');
  }

  public updateActualDamage(actualDamage: number): void {
    this.props.actualDamage = actualDamage;
    this.props.updatedAt = new Date();

    this.addAction('vehicle_inspected', `Actual damage assessed at ${this.formatAmount(actualDamage)}`, 'system');
  }

  public setInsuranceCoverage(isCovered: boolean): void {
    this.props.isInsuranceCovered = isCovered;
    this.props.updatedAt = new Date();

    const coverageStatus = isCovered ? 'covered' : 'not covered';
    this.addAction('insurance_contacted', `Insurance coverage confirmed: ${coverageStatus}`, 'system');
  }

  public addInvestigationNotes(notes: string): void {
    this.props.investigationNotes = notes;
    this.props.updatedAt = new Date();
  }

  public resolve(resolutionNotes: string): void {
    if (this.props.status === 'resolved' || this.props.status === 'closed') {
      throw new Error('Incident is already resolved or closed');
    }

    this.props.status = 'resolved';
    this.props.resolutionNotes = resolutionNotes;
    this.props.resolvedAt = new Date();
    this.props.updatedAt = new Date();

    this.addAction('resolved', 'Incident resolved', this.props.assignedInvestigator || 'system', resolutionNotes);
  }

  public close(notes?: string): void {
    if (this.props.status !== 'resolved') {
      throw new Error('Can only close resolved incidents');
    }

    this.props.status = 'closed';
    this.props.closedAt = new Date();
    this.props.updatedAt = new Date();

    this.addAction('closed', 'Incident closed', 'system', notes);
  }

  public escalate(reason: string): void {
    if (this.props.status === 'closed') {
      throw new Error('Cannot escalate closed incidents');
    }

    this.props.status = 'escalated';
    this.props.priority = Math.min(this.props.priority + 2, 10);
    this.props.updatedAt = new Date();

    this.addAction('escalated', 'Incident escalated', 'system', reason);
  }

  public addTags(tags: string[]): void {
    const newTags = tags.filter(tag => !this.props.tags.includes(tag));
    this.props.tags.push(...newTags);
    this.props.updatedAt = new Date();
  }

  public removeTags(tags: string[]): void {
    this.props.tags = this.props.tags.filter(tag => !tags.includes(tag));
    this.props.updatedAt = new Date();
  }

  public setFollowUp(required: boolean, date?: Date): void {
    this.props.followUpRequired = required;
    this.props.followUpDate = date;
    this.props.updatedAt = new Date();
  }

  // Helper methods

  public isOpen(): boolean {
    return !['resolved', 'closed'].includes(this.props.status);
  }

  public isClosed(): boolean {
    return this.props.status === 'closed';
  }

  public isResolved(): boolean {
    return this.props.status === 'resolved';
  }

  public isEscalated(): boolean {
    return this.props.status === 'escalated';
  }

  public isCritical(): boolean {
    return this.props.severity === 'critical' || this.props.priority >= 9;
  }

  public hasPoliceReport(): boolean {
    return !!this.props.policeReport;
  }

  public hasMedicalReports(): boolean {
    return this.props.medicalReports.length > 0;
  }

  public hasInsuranceClaims(): boolean {
    return this.props.insuranceClaims.length > 0;
  }

  public getOpenDays(): number {
    const endDate = this.props.closedAt || new Date();
    const diffMs = endDate.getTime() - this.props.reportedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  public getResolutionTime(): number | null {
    if (!this.props.resolvedAt) return null;
    
    const diffMs = this.props.resolvedAt.getTime() - this.props.reportedAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60)); // in hours
  }

  public getTotalDamage(): number {
    return this.props.actualDamage || this.props.estimatedDamage || 0;
  }

  public getTotalInsuranceAmount(): number {
    return this.props.insuranceClaims
      .filter(claim => claim.status === 'settled')
      .reduce((total, claim) => total + (claim.settlementAmount || 0), 0);
  }

  public getTotalMedicalCosts(): number {
    return this.props.medicalReports
      .reduce((total, report) => total + (report.medicalCost || 0), 0);
  }

  public getEvidenceByType(type: IncidentEvidence['type']): IncidentEvidence[] {
    return this.props.evidence.filter(e => e.type === type);
  }

  public getActionsByType(type: IncidentAction['type']): IncidentAction[] {
    return this.props.actions.filter(a => a.type === type);
  }

  public getPartiesByType(type: IncidentParty['type']): IncidentParty[] {
    return this.props.parties.filter(p => p.type === type);
  }

  public isOverdue(): boolean {
    if (!this.props.followUpRequired || !this.props.followUpDate) return false;
    return new Date() > this.props.followUpDate;
  }

  public getDaysUntilFollowUp(): number | null {
    if (!this.props.followUpRequired || !this.props.followUpDate) return null;
    
    const diffMs = this.props.followUpDate.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  public getTypeDisplay(): string {
    const typeMap: Record<IncidentType, string> = {
      accident: 'Accident',
      theft: 'Theft',
      harassment: 'Harassment',
      vehicle_breakdown: 'Vehicle Breakdown',
      customer_complaint: 'Customer Complaint',
      safety_concern: 'Safety Concern',
      traffic_violation: 'Traffic Violation',
      property_damage: 'Property Damage',
      injury: 'Injury',
      other: 'Other',
    };
    
    return typeMap[this.props.type];
  }

  public getSeverityDisplay(): string {
    const severityMap: Record<IncidentSeverity, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    };
    
    return severityMap[this.props.severity];
  }

  public getStatusDisplay(): string {
    const statusMap: Record<IncidentStatus, string> = {
      reported: 'Reported',
      under_investigation: 'Under Investigation',
      resolved: 'Resolved',
      closed: 'Closed',
      escalated: 'Escalated',
    };
    
    return statusMap[this.props.status];
  }

  public toJSON() {
    return {
      id: this._id.toString(),
      riderId: this.props.riderId,
      orderId: this.props.orderId,
      shiftId: this.props.shiftId,
      type: this.props.type,
      typeDisplay: this.getTypeDisplay(),
      severity: this.props.severity,
      severityDisplay: this.getSeverityDisplay(),
      status: this.props.status,
      statusDisplay: this.getStatusDisplay(),
      title: this.props.title,
      description: this.props.description,
      location: this.props.location.toJSON(),
      occurredAt: this.props.occurredAt,
      reportedAt: this.props.reportedAt,
      reportedBy: this.props.reportedBy,
      parties: this.props.parties,
      evidence: this.props.evidence,
      actions: this.props.actions.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime()),
      insuranceClaims: this.props.insuranceClaims,
      policeReport: this.props.policeReport,
      medicalReports: this.props.medicalReports,
      estimatedDamage: this.props.estimatedDamage,
      actualDamage: this.props.actualDamage,
      totalDamage: this.getTotalDamage(),
      formattedTotalDamage: this.formatAmount(this.getTotalDamage()),
      isInsuranceCovered: this.props.isInsuranceCovered,
      requiresPoliceReport: this.props.requiresPoliceReport,
      requiresMedicalAttention: this.props.requiresMedicalAttention,
      assignedInvestigator: this.props.assignedInvestigator,
      investigationNotes: this.props.investigationNotes,
      resolutionNotes: this.props.resolutionNotes,
      resolvedAt: this.props.resolvedAt,
      closedAt: this.props.closedAt,
      currency: this.props.currency,
      tags: this.props.tags,
      priority: this.props.priority,
      followUpRequired: this.props.followUpRequired,
      followUpDate: this.props.followUpDate,
      daysUntilFollowUp: this.getDaysUntilFollowUp(),
      isOverdue: this.isOverdue(),
      openDays: this.getOpenDays(),
      resolutionTimeHours: this.getResolutionTime(),
      totalInsuranceAmount: this.getTotalInsuranceAmount(),
      formattedTotalInsuranceAmount: this.formatAmount(this.getTotalInsuranceAmount()),
      totalMedicalCosts: this.getTotalMedicalCosts(),
      formattedTotalMedicalCosts: this.formatAmount(this.getTotalMedicalCosts()),
      isOpen: this.isOpen(),
      isClosed: this.isClosed(),
      isResolved: this.isResolved(),
      isEscalated: this.isEscalated(),
      isCritical: this.isCritical(),
      hasPoliceReport: this.hasPoliceReport(),
      hasMedicalReports: this.hasMedicalReports(),
      hasInsuranceClaims: this.hasInsuranceClaims(),
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}