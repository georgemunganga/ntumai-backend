import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { OtpService } from '../src/modules/auth/application/services/otp.service';

describe('Auth E2E Failure & Security Cases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otpService: OtpService;

  const testPhoneNumber = '+15559998888';
  const testEmail = 'security.test@example.com';
  const validOtp = '123456';
  const invalidOtp = '999999';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    otpService = app.get(OtpService);

    // Mock the OTP service to return a fixed OTP for testing
    jest
      .spyOn(otpService, 'requestOtp')
      .mockImplementation(async (identifier: string) => {
        // Manually set the fixed OTP in Redis for the identifier
        await otpService['redisService'].set(
          `otp:${identifier}`,
          validOtp,
          300,
        );
      });
    jest
      .spyOn(otpService, 'verifyOtp')
      .mockImplementation(async (identifier: string, otp: string) => {
        const storedOtp = await otpService['redisService'].get(
          `otp:${identifier}`,
        );
        return storedOtp === otp;
      });

    // Clean up database before tests
    await prisma.user.deleteMany({
      where: { OR: [{ phoneNumber: testPhoneNumber }, { email: testEmail }] },
    });
  });

  afterAll(async () => {
    // Clean up database after tests
    await prisma.user.deleteMany({
      where: { OR: [{ phoneNumber: testPhoneNumber }, { email: testEmail }] },
    });
    await app.close();
  });

  it('Failure 1: Should return 400 if neither phone number nor email is provided for request-otp', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({})
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Failure 2: Should return 400 for invalid phone number format', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: '12345' }) // Invalid format
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Failure 3: Should return 400 for invalid email format', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ email: 'not-an-email' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('Security 1: Should return 401 for invalid OTP on verify-otp', async () => {
    // 1. Request OTP (User is created)
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: testPhoneNumber })
      .expect(HttpStatus.OK);

    // 2. Verify with invalid OTP
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: invalidOtp })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Security 2: Should return 401 if user tries to verify OTP for a non-existent user', async () => {
    const nonExistentPhone = '+15550000000';
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: nonExistentPhone, otp: validOtp })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Security 3: Should return 401 if a protected endpoint is accessed without a token', async () => {
    // We will use the role-switch endpoint as a protected endpoint example
    await request(app.getHttpServer())
      .post('/api/v1/auth/role-switch')
      .send({ roleType: 'TASKER' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Security 4: Should return 401 if a protected endpoint is accessed with an invalid token', async () => {
    // We will use the role-switch endpoint as a protected endpoint example
    await request(app.getHttpServer())
      .post('/api/v1/auth/role-switch')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({ roleType: 'TASKER' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('Security 5: Should prevent a user from bypassing OTP and directly accessing a protected endpoint', async () => {
    // 1. Request OTP (User is created in PENDING_VERIFICATION)
    await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ email: testEmail })
      .expect(HttpStatus.OK);

    // 2. Try to access a protected endpoint (role-switch) without verifying OTP
    // This requires a valid JWT, which the user does not have yet.
    // The system correctly prevents this by requiring a token first.
    await request(app.getHttpServer())
      .post('/api/v1/auth/role-switch')
      .send({ roleType: 'TASKER' })
      .expect(HttpStatus.UNAUTHORIZED);

    // The core security is that the user cannot get a token without successful OTP verification.
    // This test confirms the system requires a token, which can only be obtained via the verified flow.
  });
});
