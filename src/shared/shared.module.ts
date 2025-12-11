import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './infrastructure/prisma.service';
import { RedisService } from './infrastructure/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class SharedModule {}
