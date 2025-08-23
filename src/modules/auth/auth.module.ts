import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy, LocalStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { AuthInfrastructureModule, JWT_SERVICE_TOKEN, NOTIFICATION_SERVICE_TOKEN } from './infrastructure';
import { JwtAdapter, NotificationAdapter } from './infrastructure/services';
import { AuthenticationService, PasswordManagementService, RepositoryMonitoringService, OtpManagementService } from './application/services';
import { AuthenticationDomainService } from './domain/services/authentication-domain.service';
import { PasswordService } from './domain/services/password.service';
import { UserManagementDomainService } from './domain/services/user-management-domain.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Empty config since it's configured in infrastructure
    AuthInfrastructureModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    PasswordManagementService,
    RepositoryMonitoringService,
    OtpManagementService,
    UserManagementDomainService,
    AuthenticationDomainService, // Legacy - deprecated
    PasswordService, // Legacy - deprecated
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
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
    AuthenticationService,
    PasswordManagementService,
    RepositoryMonitoringService,
    OtpManagementService,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
  ],
})
export class AuthModule {}