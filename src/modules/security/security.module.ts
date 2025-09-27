import { Module } from '@nestjs/common';
import { OtpApplicationService } from './application/services/otp-application.service';

@Module({
  providers: [OtpApplicationService],
  exports: [OtpApplicationService],
})
export class SecurityModule {}
