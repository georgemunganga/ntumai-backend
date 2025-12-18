import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = {
  value: string;
  expiresAt?: number;
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient?: Redis;
  private readonly useInMemory: boolean;
  private readonly memoryStore = new Map<string, MemoryEntry>();

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.useInMemory = !redisUrl || redisUrl === 'mock';

    if (!this.useInMemory && redisUrl) {
      this.redisClient = new Redis(redisUrl, { lazyConnect: true });
      this.redisClient.on('error', (error) => {
        this.logger.warn(`Redis connection issue: ${error.message}`);
      });
    } else if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL is not configured. Falling back to in-memory cache.',
      );
    }
  }

  onModuleDestroy() {
    this.redisClient?.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    if (this.useInMemory) {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      this.memoryStore.set(key, { value, expiresAt });
      return 'OK';
    }

    if (!this.redisClient) {
      return 'OK';
    }

    if (ttlSeconds) {
      return this.redisClient.set(key, value, 'EX', ttlSeconds);
    }
    return this.redisClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    if (this.useInMemory) {
      const entry = this.memoryStore.get(key);
      if (!entry) {
        return null;
      }

      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memoryStore.delete(key);
        return null;
      }

      return entry.value;
    }

    if (!this.redisClient) {
      return null;
    }

    return this.redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    if (this.useInMemory) {
      return this.memoryStore.delete(key) ? 1 : 0;
    }

    if (!this.redisClient) {
      return 0;
    }

    return this.redisClient.del(key);
  }
}
