import { Injectable } from '@nestjs/common';
import { IMatchingEngine, MatchingCriteria } from './matching-engine.interface';
import { RiderInfo } from '../../domain/entities/booking.entity';
import { DispatchService } from '../../../dispatch/application/services/dispatch.service';

@Injectable()
export class MockMatchingEngineAdapter implements IMatchingEngine {
  constructor(private readonly dispatchService: DispatchService) {}

  async findCandidates(criteria: MatchingCriteria): Promise<RiderInfo[]> {
    const scored = await this.dispatchService.rankTaskersForJob({
      jobId: `task:${criteria.pickup_lat}:${criteria.pickup_lng}:${criteria.vehicle_type}`,
      jobType: 'task',
      pickup: {
        lat: criteria.pickup_lat,
        lng: criteria.pickup_lng,
      },
      vehicleType: criteria.vehicle_type,
      radiusKm: criteria.radius_km,
    });

    return scored.length > 0 ? scored : this.getMockRiders(criteria);
  }

  private getMockRiders(criteria: MatchingCriteria): RiderInfo[] {
    return [
      {
        user_id: 'usr_r_101',
        name: 'John Mwamba',
        vehicle: criteria.vehicle_type,
        phone: '+260972111111',
        rating: 4.8,
        eta_min: 5,
      },
      {
        user_id: 'usr_r_102',
        name: 'Jane Phiri',
        vehicle: criteria.vehicle_type,
        phone: '+260972222222',
        rating: 4.9,
        eta_min: 7,
      },
      {
        user_id: 'usr_r_103',
        name: 'Peter Banda',
        vehicle: criteria.vehicle_type,
        phone: '+260972333333',
        rating: 4.7,
        eta_min: 10,
      },
    ];
  }
}
