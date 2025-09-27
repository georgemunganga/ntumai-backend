import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ConfigModule } from '@nestjs/config';
import { ErrandsModule } from './modules/errands/errands.module';
import { MarketplaceModule } from './modules/marketplace';
import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { SecurityModule } from './modules/security/security.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MarketplaceModule,
    SecurityModule,
    CommunicationModule,
    ErrandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
