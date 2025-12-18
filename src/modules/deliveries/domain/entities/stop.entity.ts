export enum StopType {
  PICKUP = 'pickup',
  DROPOFF = 'dropoff',
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Address {
  line1?: string;
  line2?: string;
  city: string;
  province?: string;
  country: string;
  postal_code?: string;
}

export class Stop {
  constructor(
    public readonly id: string,
    public type: StopType,
    public sequence: number,
    public contact_name: string | null,
    public contact_phone: string | null,
    public notes: string | null,
    public geo: GeoCoordinates | null,
    public address: Address | null,
    public completed_at: Date | null = null,
    public proof_photo_id: string | null = null,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.geo && !this.address) {
      throw new Error('Stop must have either geo coordinates or address');
    }
  }

  static create(params: {
    id: string;
    type: StopType;
    sequence: number;
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
    geo?: GeoCoordinates;
    address?: Address;
  }): Stop {
    return new Stop(
      params.id,
      params.type,
      params.sequence,
      params.contact_name || null,
      params.contact_phone || null,
      params.notes || null,
      params.geo || null,
      params.address || null,
    );
  }

  markCompleted(proofPhotoId?: string): void {
    this.completed_at = new Date();
    this.proof_photo_id = proofPhotoId || null;
  }

  isCompleted(): boolean {
    return this.completed_at !== null;
  }
}
