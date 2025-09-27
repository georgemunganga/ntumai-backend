import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Database
import { AuthDatabaseModule } from './database';
import { PrismaService } from '../../../modules/common/prisma/prisma.service';

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
    AuthDatabaseModule,
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
    // Database
    PrismaService,
    
    // Cache Service
    UserCacheService,
    
    // Repositories
    {
      provide: UserRepository,
      useClass: OptimizedPrismaUserRepository, // Using optimized version with caching
    },
    
    // Service Adapters
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
    JWT_SERVICE_TOKEN,
    NOTIFICATION_SERVICE_TOKEN,
    
    // JWT Module
    JwtModule,
    
    // Database
    PrismaService,
  ],
})
export class AuthInfrastructureModule {}