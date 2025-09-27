export interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
}

export class LocationVO {
  private constructor(
    private readonly _address: string,
    private readonly _latitude?: number,
    private readonly _longitude?: number,
    private readonly _instructions?: string,
  ) {
    this.validate();
  }

  static create(data: LocationData): LocationVO {
    return new LocationVO(
      data.address,
      data.latitude,
      data.longitude,
      data.instructions,
    );
  }

  get address(): string {
    return this._address;
  }

  get latitude(): number | undefined {
    return this._latitude;
  }

  get longitude(): number | undefined {
    return this._longitude;
  }

  get instructions(): string | undefined {
    return this._instructions;
  }

  private validate(): void {
    if (!this._address || this._address.trim().length === 0) {
      throw new Error('Address is required');
    }

    if (this._address.length > 500) {
      throw new Error('Address cannot exceed 500 characters');
    }

    if (this._instructions && this._instructions.length > 500) {
      throw new Error('Instructions cannot exceed 500 characters');
    }

    if (this._latitude !== undefined) {
      if (this._latitude < -90 || this._latitude > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }
    }

    if (this._longitude !== undefined) {
      if (this._longitude < -180 || this._longitude > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }
    }

    // If one coordinate is provided, both should be provided
    if ((this._latitude !== undefined) !== (this._longitude !== undefined)) {
      throw new Error('Both latitude and longitude must be provided together');
    }
  }

  hasCoordinates(): boolean {
    return this._latitude !== undefined && this._longitude !== undefined;
  }

  distanceTo(other: LocationVO): number | null {
    if (!this.hasCoordinates() || !other.hasCoordinates()) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other._latitude! - this._latitude!);
    const dLon = this.toRadians(other._longitude! - this._longitude!);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this._latitude!)) *
      Math.cos(this.toRadians(other._latitude!)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  equals(other: LocationVO): boolean {
    return (
      this._address === other._address &&
      this._latitude === other._latitude &&
      this._longitude === other._longitude &&
      this._instructions === other._instructions
    );
  }

  toJSON(): LocationData {
    return {
      address: this._address,
      latitude: this._latitude,
      longitude: this._longitude,
      instructions: this._instructions,
    };
  }

  toString(): string {
    return this._address;
  }
}