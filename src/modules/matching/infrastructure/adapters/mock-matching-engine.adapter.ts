import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IMatchingEngine, MatchingCriteria } from './matching-engine.interface';
import { RiderInfo } from '../../domain/entities/booking.entity';

@Injectable()
export class MockMatchingEngineAdapter implements IMatchingEngine {
  constructor(private readonly prisma: PrismaService) {}

  async findCandidates(criteria: MatchingCriteria): Promise<RiderInfo[]> {
    // Find riders with DRIVER role who have active shifts
    const riders = await this.prisma.user.findMany({
      where: {
        role: 'DRIVER',
        // In a real implementation, we'd join with shifts table
        // For now, just get all drivers
      },
      take: 10,
    });

    if (riders.length === 0) {
      // Return mock riders if no real riders found
      return this.getMockRiders(criteria);
    }

    // Convert to RiderInfo and calculate mock distances
    const candidates: RiderInfo[] = riders.map((rider) => {
      // Mock distance calculation (in real app, use Haversine formula)
      const mockDistance = Math.random() * (criteria.radius_km || 10);
      const eta_min = Math.ceil(mockDistance * 3); // ~3 min per km

      return {
        user_id: rider.id,
        name: `${rider.firstName} ${rider.lastName}`,
        vehicle: criteria.vehicle_type,
        phone: rider.phone || '+260972000000',
        rating: 4.5 + Math.random() * 0.5, // 4.5-5.0
        eta_min,
      };
    });

    // Sort by ETA and return top 3
    return candidates
      .sort((a, b) => (a.eta_min || 0) - (b.eta_min || 0))
      .slice(0, 3);
  }

  private getMockRiders(criteria: MatchingCriteria): RiderInfo[] {
    const mockRiders: RiderInfo[] = [
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

    // Randomly select 1-3 riders
    const count = Math.floor(Math.random() * 3) + 1;
    return mockRiders.slice(0, count);
  }
}
