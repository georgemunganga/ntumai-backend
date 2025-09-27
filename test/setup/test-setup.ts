import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@common/prisma/prisma.service';
import * as request from 'supertest';

export class TestSetup {
  app: INestApplication;
  prismaService: PrismaService;
  authToken: string;
  refreshToken: string;
  adminAuthToken: string;
  driverAuthToken: string;
  vendorAuthToken: string;

  async initialize() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await this.app.init();

    this.prismaService = this.app.get<PrismaService>(PrismaService);
    
    return this;
  }

  async cleanup() {
    await this.app.close();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }

  async loginAsCustomer() {
    const response = await request(this.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'password123',
      });

    if (response.status !== 200) {
      throw new Error(`Failed to login as customer: ${JSON.stringify(response.body)}`);
    }

    this.authToken = response.body.data.accessToken;
    this.refreshToken = response.body.data.refreshToken;
    return this.authToken;
  }

  async loginAsAdmin() {
    const response = await request(this.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'adminpassword123',
      });

    if (response.status !== 200) {
      throw new Error(`Failed to login as admin: ${JSON.stringify(response.body)}`);
    }

    this.adminAuthToken = response.body.data.accessToken;
    return this.adminAuthToken;
  }

  async loginAsDriver() {
    const response = await request(this.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'driver@example.com',
        password: 'driverpassword123',
      });

    if (response.status !== 200) {
      throw new Error(`Failed to login as driver: ${JSON.stringify(response.body)}`);
    }

    this.driverAuthToken = response.body.data.accessToken;
    return this.driverAuthToken;
  }

  async loginAsVendor() {
    const response = await request(this.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'vendor@example.com',
        password: 'vendorpassword123',
      });

    if (response.status !== 200) {
      throw new Error(`Failed to login as vendor: ${JSON.stringify(response.body)}`);
    }

    this.vendorAuthToken = response.body.data.accessToken;
    return this.vendorAuthToken;
  }
}