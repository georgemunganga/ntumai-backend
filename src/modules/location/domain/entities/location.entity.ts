export class LocationEntity {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;

  constructor(data: Partial<LocationEntity>) {
    Object.assign(this, data);
  }
}
