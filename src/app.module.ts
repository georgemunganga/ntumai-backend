import { AppController } from './app.controller';
import { AppService } from './app.service';
<<<<<<< HEAD
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
=======
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
// Temporarily comment out feature modules while we address compilation errors
// import { UsersModule } from './modules/users/users.module';
// import { MarketplaceModule } from './modules/marketplace';
>>>>>>> main
// import { SecurityModule } from './modules/security/security.module';
// import { CommunicationModule } from './modules/communication/communication.module';
// import { ErrandsModule } from './modules/errands/errands.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
<<<<<<< HEAD
    // Comment out modules that might be causing errors
    // CommunicationModule,
    // SecurityModule,
    AuthModule,
    UsersModule,
=======
    // Keep AuthModule enabled first while we work through module-specific errors
    AuthModule,
    // Re-enable modules one-by-one as their compilation issues are resolved
    // UsersModule,
    // MarketplaceModule,
    // SecurityModule,
    // CommunicationModule,
    // ErrandsModule,
>>>>>>> main
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
