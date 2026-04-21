export type DispatchResourceType = 'booking' | 'delivery';

export type DispatchStage =
  | 'searching'
  | 'candidates_found'
  | 'offer_sent'
  | 'reoffered'
  | 'assigned'
  | 'in_transit'
  | 'failed'
  | 'completed'
  | 'cancelled';

export interface DispatchCandidateDto {
  riderId: string;
  name: string;
  vehicle?: string;
  phone?: string;
  rating?: number;
  etaMin?: number;
  location?: {
    lat: number;
    lng: number;
    updatedAt?: string;
  };
}

export interface DispatchStatusDto {
  dispatchId: string;
  resourceType: DispatchResourceType;
  customerId?: string;
  stage: DispatchStage;
  candidateCount: number;
  activeRiderId?: string | null;
  candidates: DispatchCandidateDto[];
  message?: string;
  updatedAt: string;
}
