import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  findByUserId(userId: string): Promise<RefreshTokenEntity[]>;
  findByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<RefreshTokenEntity | null>;
  create(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  update(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<number>;
  revokeByUserIdAndDeviceId(userId: string, deviceId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
