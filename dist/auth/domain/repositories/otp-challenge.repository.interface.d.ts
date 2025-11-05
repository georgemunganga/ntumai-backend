import { OtpChallengeEntity } from '../entities/otp-challenge.entity';
export interface IOtpChallengeRepository {
    findByChallengeId(challengeId: string): Promise<OtpChallengeEntity | null>;
    findActiveByIdentifier(identifier: string): Promise<OtpChallengeEntity | null>;
    create(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity>;
    update(challenge: OtpChallengeEntity): Promise<OtpChallengeEntity>;
    invalidateByIdentifier(identifier: string): Promise<void>;
    deleteExpired(): Promise<number>;
}
