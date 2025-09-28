import { Global, Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
=======
import { PrismaService } from '@common/prisma/prisma.service';

@Global()
@Module({
>>>>>>> main
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
