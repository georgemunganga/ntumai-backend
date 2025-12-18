import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { OtpService } from '../src/modules/auth/application/services/otp.service';

describe('Auth E2E Success Cases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otpService: OtpService;

  const testPhoneNumber = '+15551234567';
  const testEmail = 'test.user@example.com';
  const testOtp = '123456'; // Mocked OTP

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
        await otpService['redisService'].set(`otp:${identifier}`, testOtp, 300);
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

  it('Scenario 1: New user signs up and logs in successfully via Phone Number', async () => {
    // 1. Request OTP (Sign-up)
    let response = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: testPhoneNumber })
      .expect(200);

    expect(response.body.message).toBe('OTP sent');

    // Check if user was created in PENDING_VERIFICATION status
    let user = await prisma.user.findUnique({
      where: { phoneNumber: testPhoneNumber },
    });
    expect(user).toBeDefined();
    expect(user?.status).toBe('PENDING_VERIFICATION');

    // 2. Verify OTP (Login)
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: testOtp })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    // Check if user status was updated to ACTIVE
    user = await prisma.user.findUnique({
      where: { phoneNumber: testPhoneNumber },
    });
    expect(user?.status).toBe('ACTIVE');
  });

  it('Scenario 2: Existing user logs in successfully via Phone Number', async () => {
    // 1. Request OTP (Login)
    let response = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ phoneNumber: testPhoneNumber })
      .expect(200);

    expect(response.body.message).toBe('OTP sent');

    // Check if user status remains ACTIVE
    const user = await prisma.user.findUnique({
      where: { phoneNumber: testPhoneNumber },
    });
    expect(user?.status).toBe('ACTIVE');

    // 2. Verify OTP (Login)
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: testPhoneNumber, otp: testOtp })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('Scenario 3: New user signs up and logs in successfully via Email', async () => {
    // Clean up previous test data for this scenario
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // 1. Request OTP (Sign-up)
    let response = await request(app.getHttpServer())
      .post('/api/v1/auth/request-otp')
      .send({ email: testEmail })
      .expect(200);

    expect(response.body.message).toBe('OTP sent');

    // Check if user was created in PENDING_VERIFICATION status
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).toBeDefined();
    expect(user?.status).toBe('PENDING_VERIFICATION');

    // 2. Verify OTP (Login)
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ email: testEmail, otp: testOtp })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    // Check if user status was updated to ACTIVE
    user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.status).toBe('ACTIVE');
  });

  it('Scenario 4: User can switch role successfully', async () => {
    // First, log in to get a token
    let response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ email: testEmail, otp: testOtp })
      .expect(200);

    const accessToken = response.body.accessToken;

    // To test role switch, the user must have the target role.
    // We will manually add the TASKER role to the user for this test.
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleType: 'TASKER',
        },
      });
    }

    // 2. Switch Role
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/role-switch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ roleType: 'TASKER' })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    // NOTE: A real test would decode the token to verify the activeRole claim
  });
});
