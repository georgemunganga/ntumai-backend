import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy, LocalStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { AuthInfrastructureModule, JWT_SERVICE_TOKEN, NOTIFICATION_SERVICE_TOKEN } from './infrastructure';
import { JwtAdapter, NotificationAdapter } from './infrastructure/services';
import { AuthenticationService, PasswordManagementService, RepositoryMonitoringService } from './application/services';
import { OtpSecurityAdapter } from './application/services/otp-security.adapter';
import { UserManagementDomainService } from './domain/services/user-management-domain.service';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthInfrastructureModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    PasswordManagementService,
    RepositoryMonitoringService,
    OtpSecurityAdapter,
    UserManagementDomainService,
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
    OtpSecurityAdapter,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
  ],
})
export class AuthModule {}