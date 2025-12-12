import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    const accelerateUrl = configService.get<string>('DATABASE_URL');
    if (!accelerateUrl) {
      throw new Error('DATABASE_URL is not defined. Please add it to your .env file.');
    }

    super({
      accelerateUrl,
    });
  }


  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
