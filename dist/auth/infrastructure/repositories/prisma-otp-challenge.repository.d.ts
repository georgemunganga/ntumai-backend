import { PrismaService } from '../../../shared/database/prisma.service';
import { IOtpChallengeRepository } from '../../domain/repositories/otp-challenge.repository.interface';
import { OtpChallengeEntity } from '../../domain/entities/otp-challenge.entity';
export declare class PrismaOtpChallengeRepository implements IOtpChallengeRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByChallengeId(challengeId: string): Promise<OtpChallengeEntity | null>;
    findActiveByIdentifier(identifier: string): Promise<OtpChallengeEntity | null>;
    create(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity>;
    update(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity>;
    invalidateByIdentifier(identifier: string): Promise<void>;
    deleteExpired(): Promise<number>;
    private toDomain;
}
