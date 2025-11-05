import { PushTokenEntity } from '../entities/push-token.entity';

export interface IPushTokenRepository {
  findByUserId(userId: string): Promise<PushTokenEntity[]>;
  findByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<PushTokenEntity | null>;
  create(pushToken: PushTokenEntity): Promise<PushTokenEntity>;
  update(pushToken: PushTokenEntity): Promise<PushTokenEntity>;
  delete(id: string): Promise<void>;
  deleteByDeviceId(userId: string, deviceId: string): Promise<void>;
}
