import { ValueObject } from '../../../common/domain/value-object';

export interface LocationProps {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  timestamp?: Date;
}

export class Location extends ValueObject<LocationProps> {
  private constructor(props: LocationProps) {
    super(props);
  }

  public static create(props: LocationProps): Location {
    if (!props.latitude || !props.longitude) {
      throw new Error('Latitude and longitude are required');
    }

    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }

    return new Location({
      ...props,
      timestamp: props.timestamp || new Date(),
    });
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get country(): string | undefined {
    return this.props.country;
  }

  get timestamp(): Date | undefined {
    return this.props.timestamp;
  }

  /**
   * Calculate distance to another location using Haversine formula
   * @param other - Another location
   * @returns Distance in kilometers
   */
  distanceTo(other: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.latitude - this.props.latitude);
    const dLon = this.toRadians(other.longitude - this.props.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.props.latitude)) *
      Math.cos(this.toRadians(other.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if location is within a certain radius of another location
   * @param other - Another location
   * @param radiusKm - Radius in kilometers
   * @returns True if within radius
   */
  isWithinRadius(other: Location, radiusKm: number): boolean {
    return this.distanceTo(other) <= radiusKm;
  }

  /**
   * Get coordinates as a string
   * @returns Formatted coordinates string
   */
  getCoordinatesString(): string {
    return `${this.props.latitude.toFixed(6)}, ${this.props.longitude.toFixed(6)}`;
  }

  /**
   * Check if location data is recent (within specified minutes)
   * @param minutes - Number of minutes to consider as recent
   * @returns True if location is recent
   */
  isRecent(minutes: number = 5): boolean {
    if (!this.props.timestamp) return false;
    const now = new Date();
    const diffMs = now.getTime() - this.props.timestamp.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= minutes;
  }

  /**
   * Update location with new coordinates
   * @param latitude - New latitude
   * @param longitude - New longitude
   * @returns New Location instance
   */
  updateCoordinates(latitude: number, longitude: number): Location {
    return Location.create({
      ...this.props,
      latitude,
      longitude,
      timestamp: new Date(),
    });
  }

  /**
   * Add address information to location
   * @param address - Street address
   * @param city - City name
   * @param country - Country name
   * @returns New Location instance with address
   */
  withAddress(address: string, city?: string, country?: string): Location {
    return Location.create({
      ...this.props,
      address,
      city,
      country,
    });
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  toJSON() {
    return {
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      address: this.props.address,
      city: this.props.city,
      country: this.props.country,
      timestamp: this.props.timestamp,
    };
  }
}