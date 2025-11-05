import { PrismaService } from '../../../shared/database/prisma.service';
import { IMatchingEngine, MatchingCriteria } from './matching-engine.interface';
import { RiderInfo } from '../../domain/entities/booking.entity';
export declare class MockMatchingEngineAdapter implements IMatchingEngine {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findCandidates(criteria: MatchingCriteria): Promise<RiderInfo[]>;
    private getMockRiders;
}
