import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy, LocalStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { AuthInfrastructureModule } from './infrastructure';
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
    // Service tokens are re-exported from AuthInfrastructureModule
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