import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicationsService } from './communications.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('MAIL_HOST');
        const port = parseInt(configService.get('MAIL_PORT') || '587', 10);
        const encryption = (configService.get('MAIL_ENCRYPTION') || '').toLowerCase();
        const secure =
          configService.get('MAIL_SECURE') === 'true' ||
          encryption === 'ssl' ||
          encryption === 'tls' ||
          port === 465;
        const user =
          configService.get('MAIL_USERNAME') || configService.get('MAIL_USER');
        const pass = configService.get('MAIL_PASSWORD');
        const fromAddress =
          configService.get('MAIL_FROM_ADDRESS') || configService.get('MAIL_FROM');
        const fromName =
          configService.get('MAIL_FROM_NAME') ||
          configService.get('APP_NAME') ||
          'Ntumai Platform';

        return {
          transport: {
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"${fromName}" <${fromAddress}>`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
