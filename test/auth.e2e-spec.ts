import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { RedisService } from 'src/shared/infrastructure/redis.service';
import { PrismaService } from 'src/shared/infrastructure/prisma.service';
import { UserRepository } from 'src/modules/users/infrastructure/repositories/user.repository';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const testPhoneNumber = '+261234567890';
  const testEmail = 'test@example.com';
  const testOtp = '123456';

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserRepository = {
    findByPhoneNumber: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockCommunicationService = {
    sendOtp: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRATION: '1h',
        JWT_REFRESH_EXPIRATION: '7d',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        MAIL_HOST: 'smtp.test.com',
        MAIL_PORT: '587',
        MAIL_SECURE: 'false',
        MAIL_USER: 'test@test.com',
        MAIL_PASSWORD: 'test-password',
        MAIL_FROM: 'test@test.com',
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(UserRepository)
      .useValue(mockUserRepository)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(CommunicationService)
      .useValue(mockCommunicationService)
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/v1/auth/request-otp (POST)', () => {
    it('should send OTP for phone number', async () => {
      mockUserRepository.findByPhoneNumber.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(
          new UserEntity({
            id: 'new-user-id',
            phoneNumber: user.phoneNumber,
            email: user.email,
            status: 'PENDING_VERIFICATION',
          }),
        ),
      );
      mockRedisService.set.mockResolvedValue('OK');
      mockCommunicationService.sendOtp.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ phoneNumber: testPhoneNumber })
        .expect(200);

      expect(response.body.message).toBe('OTP sent');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `otp:${testPhoneNumber}`,
        expect.any(String),
        300,
      );
      expect(mockCommunicationService.sendOtp).toHaveBeenCalledWith(
        testPhoneNumber,
        expect.any(String),
      );
    });

    it('should send OTP for email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(
          new UserEntity({
            id: 'new-user-id',
            phoneNumber: user.phoneNumber,
            email: user.email,
            status: 'PENDING_VERIFICATION',
          }),
        ),
      );
      mockRedisService.set.mockResolvedValue('OK');
      mockCommunicationService.sendOtp.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body.message).toBe('OTP sent');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `otp:${testEmail}`,
        expect.any(String),
        300,
      );
    });

    it('should return 400 if neither phone nor email provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/request-otp')
        .send({})
        .expect(400);
    });
  });

  describe('/api/v1/auth/verify-otp (POST)', () => {
    it('should verify OTP and return tokens for phone number', async () => {
      mockRedisService.get.mockResolvedValue(testOtp);
      mockRedisService.del.mockResolvedValue(1);
      mockUserRepository.findByPhoneNumber.mockResolvedValue(
        new UserEntity({
          id: 'user-id-phone',
          phoneNumber: testPhoneNumber,
          email: null,
          status: 'PENDING_VERIFICATION',
        }),
      );
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(
          new UserEntity({
            id: user.id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            status: 'ACTIVE',
          }),
        ),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhoneNumber, otp: testOtp });

      if (response.status !== 200) {
        console.error('Response status:', response.status);
        console.error('Response body:', response.body);
      }
      expect(response.status).toBe(200);

      expect(response.body.accessToken).toBe('test-token');
      expect(response.body.refreshToken).toBe('test-token');
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `otp:${testPhoneNumber}`,
      );
    });

    it('should verify OTP and return tokens for email', async () => {
      mockRedisService.get.mockResolvedValue(testOtp);
      mockRedisService.del.mockResolvedValue(1);
      mockUserRepository.findByEmail.mockResolvedValue(
        new UserEntity({
          id: 'user-id-email',
          phoneNumber: null,
          email: testEmail,
          status: 'PENDING_VERIFICATION',
        }),
      );
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(
          new UserEntity({
            id: user.id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            status: 'ACTIVE',
          }),
        ),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: testEmail, otp: testOtp })
        .expect(200);

      expect(response.body.accessToken).toBe('test-token');
      expect(response.body.refreshToken).toBe('test-token');
      expect(mockRedisService.del).toHaveBeenCalledWith(`otp:${testEmail}`);
    });

    it('should return 401 for invalid OTP', async () => {
      mockRedisService.get.mockResolvedValue('wrong-otp');

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhoneNumber, otp: testOtp })
        .expect(401);
    });

    it('should return 401 for expired OTP', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ phoneNumber: testPhoneNumber, otp: testOtp })
        .expect(401);
    });

    it('should return 400 if neither phone nor email provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ otp: testOtp })
        .expect(400);
    });
  });
});
