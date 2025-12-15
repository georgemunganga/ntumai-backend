import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
// import { UsersModule } from '../users/users.module'; // Removed as UsersModule was removed
import { CommunicationModule } from '../communication/communication.module';
import { SharedModule } from 'src/shared/shared.module';
import { AuthService } from './application/services/auth.service';
import { AuthServiceV2 } from './application/services/auth-v2.service';
import { OtpService } from './application/services/otp.service';
import { OtpServiceV2 } from './application/services/otp-v2.service';
import { AuthController } from './interfaces/controllers/auth.controller';
import { AuthV2Controller } from './interfaces/controllers/auth-v2.controller';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { OtpSessionRepository } from './infrastructure/repositories/otp-session.repository';
// import { TaskerOnboardingService } from './application/services/onboarding/tasker-onboarding.service'; // Removed due to missing Vendor/Tasker models
// import { VendorOnboardingService } from './application/services/onboarding/vendor-onboarding.service'; // Removed due to missing Vendor/Tasker models
// import { OnboardingController } from './interfaces/controllers/onboarding.controller'; // Removed due to missing Vendor/Tasker models

@Module({
  imports: [
    // UsersModule,
    CommunicationModule,
    SharedModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    AuthServiceV2,
    OtpService,
    OtpServiceV2,
    // TaskerOnboardingService, // Removed
    // VendorOnboardingService, // Removed
    JwtAuthGuard,
    OtpSessionRepository,
  ],
  controllers: [AuthController, AuthV2Controller],
  exports: [AuthService, AuthServiceV2, JwtAuthGuard],
})
export class AuthModule {}
