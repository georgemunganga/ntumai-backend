import { Test, TestingModule } from '@nestjs/testing';



import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { RedisService } from 'src/shared/infrastructure/redis.service';
import { CommunicationService } from 'src/modules/communication/communication.service';




describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;
  const testPhoneNumber = '+261234567890';
  const testEmail = 'test@example.com';
  const testOtp = '123456';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CommunicationService)
      .useValue({ sendOtp: jest.fn() }) // Mock communication service
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await redisService.del(`otp:${testPhoneNumber}`);
    await redisService.del(`otp:${testEmail}`);
    await app.close();
  });

  it('/api/v1/auth/request-otp (POST) - Phone Number', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: testPhoneNumber })
      .expect(201);

    expect(response.body.message).toBe('OTP sent');
    const otp = await redisService.get(`otp:${testPhoneNumber}`);
    expect(otp).toBeDefined();
    // Store the OTP for the next test
    process.env.TEST_OTP_PHONE = otp;
  });

  it('/api/v1/auth/request-otp (POST) - Email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ email: testEmail })
      .expect(201);

    expect(response.body.message).toBe('OTP sent');
    const otp = await redisService.get(`otp:${testEmail}`);
    expect(otp).toBeDefined();
    // Store the OTP for the next test
    process.env.TEST_OTP_EMAIL = otp;
  });

  it('/api/v1/auth/verify-otp (POST) - Phone Number Success', async () => {
    // Manually set a known OTP for verification
    await redisService.set(`otp:${testPhoneNumber}`, testOtp, 300);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: testOtp })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    const otpAfterVerification = await redisService.get(`otp:${testPhoneNumber}`);
    expect(otpAfterVerification).toBeNull(); // OTP should be deleted after successful verification
  });

  it('/api/v1/auth/verify-otp (POST) - Email Success', async () => {
    // Manually set a known OTP for verification
    await redisService.set(`otp:${testEmail}`, testOtp, 300);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ email: testEmail, otp: testOtp })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    const otpAfterVerification = await redisService.get(`otp:${testEmail}`);
    expect(otpAfterVerification).toBeNull(); // OTP should be deleted after successful verification
  });

  it('/api/v1/auth/verify-otp (POST) - Invalid OTP', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: '000000' })
      .expect(401);
  });

  it('/api/v1/auth/verify-otp (POST) - Expired/Missing OTP', () => {
    // Ensure OTP is not in Redis
    redisService.del(`otp:${testPhoneNumber}`);
    return request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: testOtp })
      .expect(401);
  });
});
