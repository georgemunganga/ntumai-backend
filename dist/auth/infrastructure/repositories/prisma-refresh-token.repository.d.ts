import { PrismaService } from '../../../shared/database/prisma.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
export declare class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
    findByUserId(userId: string): Promise<RefreshTokenEntity[]>;
    findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<RefreshTokenEntity | null>;
    create(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
    update(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
    revokeByTokenHash(tokenHash: string): Promise<void>;
    revokeAllByUserId(userId: string): Promise<number>;
    revokeByUserIdAndDeviceId(userId: string, deviceId: string): Promise<void>;
    deleteExpired(): Promise<number>;
    private toDomain;
}
