import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users/users.module';
// import { PrismaModule } from './modules/common/prisma/prisma.module';
// import { SecurityModule } from './modules/security/security.module';
// import { CommunicationModule } from './modules/communication/communication.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // PrismaModule,
    // Comment out modules that might be causing errors
    // CommunicationModule,
    // SecurityModule,
    //AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
