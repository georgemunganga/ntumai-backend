import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/database/prisma.service';
import { OtpService } from '../src/auth/infrastructure/services/otp.service';
import { OtpCode } from '../src/auth/domain/value-objects/otp-code.vo';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otpService: OtpService;

  const mockOtp = '123456';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    otpService = app.get(OtpService);

    // Mock OTP generation
    jest
      .spyOn(otpService, 'generateOtp')
      .mockReturnValue(OtpCode.fromPlain(mockOtp));
    // Mock sending OTP
    jest.spyOn(otpService, 'sendOtpViaEmail').mockResolvedValue();
    jest.spyOn(otpService, 'sendOtpViaSms').mockResolvedValue();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('should run the full OTP-first registration and login flow', async () => {
    const testEmail = `test-${Date.now()}@example.com`;

    // 1. Request OTP for a new user
    const otpRequestRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({
        purpose: 'register',
        email: testEmail,
      })
      .expect(202);

    const { challengeId } = otpRequestRes.body.data;
    expect(challengeId).toBeDefined();

    // 2. Verify OTP for a new user
    const otpVerifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId,
        otp: mockOtp,
      })
      .expect(200);

    const { registrationToken } = otpVerifyRes.body.data;
    expect(registrationToken).toBeDefined();

    // 3. Complete Registration
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        registrationToken,
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        role: 'CUSTOMER',
      })
      .expect(201);

    const { user, tokens } = registerRes.body.data;
    expect(user.email).toBe(testEmail);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    // 4. Access protected route with access token
    const profileRes = await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);

    expect(profileRes.body.data.id).toBe(user.id);
    expect(profileRes.body.data.email).toBe(testEmail);

    // 5. Refresh token
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(200);

    const newTokens = refreshRes.body.data;
    expect(newTokens.accessToken).toBeDefined();
    expect(newTokens.refreshToken).toBeDefined();

    // 6. Access protected route with new access token
    await request(app.getHttpServer())
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${newTokens.accessToken}`)
      .expect(200);

    // 7. Logout
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({
        userId: user.id,
        refreshToken: newTokens.refreshToken,
      })
      .expect(200);

    // 8. Try to refresh again with the old (now revoked) token
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: newTokens.refreshToken })
      .expect(401);
  });
});
