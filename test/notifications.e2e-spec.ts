import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { NotificationType } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/database/prisma.service';
import { OtpService } from '../src/auth/infrastructure/services/otp.service';
import { OtpCode } from '../src/auth/domain/value-objects/otp-code.vo';
import { NotificationsService } from '../src/notifications/application/services/notifications.service';
import { NotificationsGateway } from '../src/notifications/infrastructure/websocket/notifications.gateway';

jest.setTimeout(30000);

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let otpService: OtpService;
  let notificationsService: NotificationsService;
  let notificationsGateway: NotificationsGateway;

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
    notificationsService = app.get(NotificationsService);
    notificationsGateway = app.get(NotificationsGateway);

    jest
      .spyOn(otpService, 'generateOtp')
      .mockReturnValue(OtpCode.fromPlain(mockOtp));
    jest.spyOn(otpService, 'sendOtpViaEmail').mockResolvedValue();
    jest.spyOn(otpService, 'sendOtpViaSms').mockResolvedValue();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    (
      otpService.generateOtp as jest.MockedFunction<
        typeof otpService.generateOtp
      >
    ).mockReturnValue(OtpCode.fromPlain(mockOtp));
    (
      otpService.sendOtpViaEmail as jest.MockedFunction<
        typeof otpService.sendOtpViaEmail
      >
    ).mockResolvedValue();
    (
      otpService.sendOtpViaSms as jest.MockedFunction<
        typeof otpService.sendOtpViaSms
      >
    ).mockResolvedValue();

    await prisma.notification.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  async function completeRegistration() {
    const testEmail = `notif-${Date.now()}@example.com`;

    const otpRequestRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({
        purpose: 'register',
        email: testEmail,
      })
      .expect(202);

    const { challengeId } = otpRequestRes.body.data;

    const otpVerifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({
        challengeId,
        otp: mockOtp,
      })
      .expect(200);

    const { registrationToken } = otpVerifyRes.body.data;

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        registrationToken,
        firstName: 'Notifier',
        lastName: 'User',
        password: 'Password123!',
        role: 'CUSTOMER',
      })
      .expect(201);

    return {
      user: registerRes.body.data.user,
      tokens: registerRes.body.data.tokens,
      email: testEmail,
    };
  }

  it('creates a welcome notification and paginates user history via REST', async () => {
    const { user, tokens } = await completeRegistration();

    await notificationsService.createNotification(user.id, {
      title: 'Promo',
      message: "Check out today's offers",
      type: NotificationType.PROMOTION,
    });

    await notificationsService.createNotification(user.id, {
      title: 'Account Update',
      message: 'Your profile was reviewed',
      type: NotificationType.SYSTEM,
    });

    const pageOne = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);

    expect(pageOne.body.success).toBe(true);
    expect(pageOne.body.data.notifications).toHaveLength(2);
    expect(pageOne.body.data.unreadCount).toBe(3);
    expect(pageOne.body.data.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      hasMore: true,
    });

    const titlesPageOne = pageOne.body.data.notifications.map(
      (notification: any) => notification.title,
    );
    expect(titlesPageOne).toContain('Account Update');
    expect(titlesPageOne).toContain('Promo');

    const pageTwo = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .query({ page: 2, limit: 2 })
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);

    expect(pageTwo.body.data.notifications).toHaveLength(1);
    expect(pageTwo.body.data.meta).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      hasMore: false,
    });

    const welcome = pageTwo.body.data.notifications[0];
    expect(welcome.title).toBe('Welcome to Ntumai');
    expect(welcome.isRead).toBe(false);
  });

  it('acknowledges notifications through the websocket gateway', async () => {
    const { user } = await completeRegistration();

    const unread = await notificationsService.createNotification(user.id, {
      title: 'Dispatch Update',
      message: 'Your order is on the way',
      type: NotificationType.SYSTEM,
    });

    const emitSpy = jest
      .spyOn(notificationsGateway, 'emitNotificationRead')
      .mockImplementation(() => undefined);

    const response = await notificationsGateway.handleMarkRead(
      { notificationId: unread.id, userId: user.id },
      { id: 'test-socket' } as any,
    );

    expect(response).toEqual({
      success: true,
      message: 'Notification marked as read',
    });

    const { notifications, unreadCount } =
      await notificationsService.getUserNotifications(user.id, {
        includeRead: true,
      });

    const updated = notifications.find(
      (notification) => notification.id === unread.id,
    );

    expect(updated?.isRead).toBe(true);
    expect(unreadCount).toBe(1); // welcome notification remains unread
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ id: unread.id }),
    );
  });
});
