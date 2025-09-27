import { Module } from '@nestjs/common';
import { AuthPrismaService } from './prisma.service';
import { PrismaModule } from '../../../../modules/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuthPrismaService],
  exports: [AuthPrismaService],
})
export class AuthDatabaseModule {}