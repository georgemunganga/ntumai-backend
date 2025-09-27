import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
<<<<<<< HEAD
import { MarketplaceModule } from './modules/marketplace';
=======
import { SecurityModule } from './modules/security/security.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ErrandsModule } from './modules/errands/errands.module';
>>>>>>> main

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
<<<<<<< HEAD
    MarketplaceModule,
=======
    SecurityModule,
    CommunicationModule,
    ErrandsModule,
>>>>>>> main
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
