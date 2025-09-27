import { Incident } from '../entities/incident.entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Location } from '../value-objects/location.vo';

export interface IncidentSearchFilters {
  riderId?: string;
  orderId?: string;
  type?: string[];
  severity?: string[];
  status?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  reportedDate?: {
    after?: Date;
    before?: Date;
  };
  resolvedDate?: {
    after?: Date;
    before?: Date;
  };
  hasInjuries?: boolean;
  hasPropertyDamage?: boolean;
  hasInsuranceClaim?: boolean;
  hasPoliceReport?: boolean;
  hasMedicalReport?: boolean;
  investigatorId?: string;
  damageAmount?: {
    min?: number;
    max?: number;
  };
  isResolved?: boolean;
  isCritical?: boolean;
  tags?: string[];
}

export interface IncidentSortOptions {
  field: 'reportedAt' | 'resolvedAt' | 'severity' | 'damageAmount' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface InvolvedParty {
  id: string;
  type: 'rider' | 'customer' | 'third_party' | 'property_owner' | 'witness';
  name: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  role: string;
  statement?: string;
  injuries?: string[];
  insuranceInfo?: {
    company: string;
    policyNumber: string;
    contactInfo: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'document' | 'audio' | 'other';
  url: string;
  description: string;
  uploadedBy: string;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    dimensions?: { width: number; height: number };
    duration?: number;
  };
  createdAt: Date;
}

export interface ActionTaken {
  id: string;
  type: 'investigation' | 'medical_assistance' | 'police_contact' | 'insurance_claim' | 'repair' | 'compensation' | 'other';
  description: string;
  takenBy: string;
  takenAt: Date;
  cost?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  insuranceCompany: string;
  policyNumber: string;
  claimAmount: number;
  currency: string;
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'settled' | 'closed';
  filedAt: Date;
  settledAt?: Date;
  settledAmount?: number;
  adjusterInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoliceReport {
  id: string;
  reportNumber: string;
  department: string;
  officerName: string;
  officerBadge: string;
  filedAt: Date;
  reportUrl?: string;
  summary: string;
  charges?: string[];
  citations?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalReport {
  id: string;
  facilityName: string;
  doctorName: string;
  reportDate: Date;
  injuries: string[];
  treatment: string[];
  cost: number;
  currency: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentAnalytics {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  averageResolutionTime: number;
  totalDamageAmount: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    resolved: number;
    totalDamage: number;
  }>;
  topLocations: Array<{
    area: string;
    count: number;
    severity: string;
  }>;
}

export interface IncidentRepository {
  // Basic CRUD operations
  save(incident: Incident): Promise<void>;
  findById(id: UniqueEntityID): Promise<Incident | null>;
  findByRiderId(
    riderId: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;
  findByOrderId(orderId: string): Promise<Incident[]>;
  delete(id: UniqueEntityID): Promise<void>;
  exists(id: UniqueEntityID): Promise<boolean>;

  // Search and filtering
  findMany(
    filters?: IncidentSearchFilters,
    sort?: IncidentSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findByIds(ids: UniqueEntityID[]): Promise<Incident[]>;

  // Type-based queries
  findByType(
    type: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findAccidents(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findThefts(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findVehicleIssues(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findCustomerComplaints(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Severity-based queries
  findBySeverity(
    severity: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findCriticalIncidents(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findHighSeverityIncidents(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Status-based queries
  findByStatus(
    status: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findOpenIncidents(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findUnderInvestigation(
    investigatorId?: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findResolvedIncidents(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findClosedIncidents(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Time-based queries
  findByDateRange(
    startDate: Date,
    endDate: Date,
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findRecentIncidents(
    hours: number,
    riderId?: UniqueEntityID
  ): Promise<Incident[]>;

  findTodaysIncidents(
    riderId?: UniqueEntityID
  ): Promise<Incident[]>;

  findThisWeeksIncidents(
    riderId?: UniqueEntityID
  ): Promise<Incident[]>;

  findThisMonthsIncidents(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Location-based queries
  findByLocation(
    location: Location,
    radius: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Incident[]>;

  findInArea(
    bounds: {
      northEast: Location;
      southWest: Location;
    },
    timeframe?: { start: Date; end: Date }
  ): Promise<Incident[]>;

  findHotspots(
    timeframe?: { start: Date; end: Date },
    minIncidents?: number
  ): Promise<Array<{
    location: Location;
    incidentCount: number;
    severityDistribution: Record<string, number>;
    commonTypes: string[];
  }>>;

  // Damage and financial queries
  findByDamageAmount(
    minAmount: number,
    maxAmount: number,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findHighDamageIncidents(
    threshold: number,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findWithInsuranceClaims(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Investigation and reporting queries
  findByInvestigator(
    investigatorId: string,
    status?: string[],
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findWithPoliceReports(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findWithMedicalReports(
    riderId?: UniqueEntityID,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  findWithInjuries(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Incident>>;

  // Involved parties management
  addInvolvedParty(
    incidentId: UniqueEntityID,
    party: Omit<InvolvedParty, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvolvedParty>;

  getInvolvedParties(incidentId: UniqueEntityID): Promise<InvolvedParty[]>;

  updateInvolvedParty(
    partyId: string,
    updates: Partial<InvolvedParty>
  ): Promise<InvolvedParty>;

  removeInvolvedParty(partyId: string): Promise<void>;

  // Evidence management
  addEvidence(
    incidentId: UniqueEntityID,
    evidence: Omit<Evidence, 'id' | 'createdAt'>
  ): Promise<Evidence>;

  getEvidence(incidentId: UniqueEntityID): Promise<Evidence[]>;

  updateEvidence(
    evidenceId: string,
    updates: Partial<Evidence>
  ): Promise<Evidence>;

  removeEvidence(evidenceId: string): Promise<void>;

  // Actions management
  addAction(
    incidentId: UniqueEntityID,
    action: Omit<ActionTaken, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ActionTaken>;

  getActions(incidentId: UniqueEntityID): Promise<ActionTaken[]>;

  updateAction(
    actionId: string,
    updates: Partial<ActionTaken>
  ): Promise<ActionTaken>;

  // Insurance claims management
  addInsuranceClaim(
    incidentId: UniqueEntityID,
    claim: Omit<InsuranceClaim, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InsuranceClaim>;

  getInsuranceClaims(incidentId: UniqueEntityID): Promise<InsuranceClaim[]>;

  updateInsuranceClaim(
    claimId: string,
    updates: Partial<InsuranceClaim>
  ): Promise<InsuranceClaim>;

  findClaimsByStatus(
    status: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<InsuranceClaim>>;

  // Police reports management
  addPoliceReport(
    incidentId: UniqueEntityID,
    report: Omit<PoliceReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PoliceReport>;

  getPoliceReports(incidentId: UniqueEntityID): Promise<PoliceReport[]>;

  updatePoliceReport(
    reportId: string,
    updates: Partial<PoliceReport>
  ): Promise<PoliceReport>;

  // Medical reports management
  addMedicalReport(
    incidentId: UniqueEntityID,
    report: Omit<MedicalReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MedicalReport>;

  getMedicalReports(incidentId: UniqueEntityID): Promise<MedicalReport[]>;

  updateMedicalReport(
    reportId: string,
    updates: Partial<MedicalReport>
  ): Promise<MedicalReport>;

  // Analytics and reporting
  getIncidentAnalytics(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<IncidentAnalytics>;

  getIncidentTrends(
    period: 'daily' | 'weekly' | 'monthly',
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    period: string;
    count: number;
    resolved: number;
    critical: number;
    totalDamage: number;
  }>>;

  getRiderIncidentHistory(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalIncidents: number;
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    averageResolutionTime: number;
    totalDamageAmount: number;
    safetyScore: number;
  }>;

  getLocationAnalytics(
    location?: Location,
    radius?: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalIncidents: number;
    incidentDensity: number;
    commonTypes: string[];
    averageSeverity: number;
    safetyRating: number;
  }>;

  // Risk assessment
  calculateRiderRiskScore(
    riderId: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    recommendations: string[];
  }>;

  identifyHighRiskRiders(
    threshold?: number,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    riderId: string;
    riskScore: number;
    incidentCount: number;
    lastIncidentDate: Date;
  }>>;

  // Compliance and alerts
  getComplianceReport(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<{
    totalIncidents: number;
    reportedOnTime: number;
    properDocumentation: number;
    complianceScore: number;
    violations: Array<{
      type: string;
      count: number;
      severity: string;
    }>;
  }>;

  getAlerts(): Promise<{
    critical: Array<{
      incidentId: string;
      type: string;
      message: string;
      reportedAt: Date;
    }>;
    overdue: Array<{
      incidentId: string;
      type: string;
      daysPastDue: number;
    }>;
    followUp: Array<{
      incidentId: string;
      action: string;
      dueDate: Date;
    }>;
  }>;

  // Bulk operations
  saveMany(incidents: Incident[]): Promise<void>;
  updateMany(
    filters: IncidentSearchFilters,
    updates: Partial<{
      status: string;
      severity: string;
      investigatorId: string;
      tags: string[];
    }>
  ): Promise<number>;

  deleteMany(filters: IncidentSearchFilters): Promise<number>;

  // Advanced queries
  findSimilarIncidents(
    incidentId: UniqueEntityID,
    criteria: ('type' | 'location' | 'severity' | 'rider' | 'circumstances')[]
  ): Promise<Incident[]>;

  findPatterns(
    riderId?: UniqueEntityID,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    pattern: string;
    frequency: number;
    riskLevel: string;
    recommendations: string[];
  }>>;

  // Cache management
  invalidateCache(incidentId?: UniqueEntityID): Promise<void>;
  warmupCache(incidentIds: UniqueEntityID[]): Promise<void>;

  // Event sourcing support
  getVersion(id: UniqueEntityID): Promise<number>;
  saveWithVersion(incident: Incident, expectedVersion: number): Promise<void>;
}