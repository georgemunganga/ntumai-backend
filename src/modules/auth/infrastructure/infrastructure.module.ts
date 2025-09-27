import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Database
import { PrismaModule } from '@common/prisma/prisma.module';

// Repositories
import { UserCacheService, OptimizedPrismaUserRepository } from './repositories';
import { UserRepository } from '../domain/repositories';

// Service Adapters
import { JwtAdapter, NotificationAdapter } from './services';

// Injection tokens
export const JWT_SERVICE_TOKEN = 'JWT_SERVICE';
export const NOTIFICATION_SERVICE_TOKEN = 'NOTIFICATION_SERVICE';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    // Cache Service
    UserCacheService,

    // Repositories
    {
      provide: UserRepository,
      useClass: OptimizedPrismaUserRepository, // Using optimized version with caching
    },

    // Service Adapters
    JwtAdapter,
    NotificationAdapter,
    {
      provide: JWT_SERVICE_TOKEN,
      useClass: JwtAdapter,
    },
    {
      provide: NOTIFICATION_SERVICE_TOKEN,
      useClass: NotificationAdapter,
    },
  ],
  exports: [
    // Repositories
    UserRepository,

    // Cache Service
    UserCacheService,

    // Service Adapters
    JwtAdapter,
    JWT_SERVICE_TOKEN,
    NOTIFICATION_SERVICE_TOKEN,

    // JWT Module
    JwtModule,
    
  ],
})
export class AuthInfrastructureModule {}