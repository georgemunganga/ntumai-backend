import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { JwtStrategy, LocalStrategy } from './strategies';
import { JwtAuthGuard, RolesGuard } from './guards';
import { AuthInfrastructureModule } from './infrastructure';
import { AuthenticationService, PasswordManagementService } from './application/services';
import { AuthenticationDomainService } from './domain/services/authentication-domain.service';
import { PasswordService } from './domain/services/password.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthInfrastructureModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    PasswordManagementService,
    AuthenticationDomainService,
    PasswordService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthenticationService,
    PasswordManagementService,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
  ],
})
export class AuthModule {}