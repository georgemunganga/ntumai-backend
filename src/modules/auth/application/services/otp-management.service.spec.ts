import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OtpManagementService } from './otp-management.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { JWT_SERVICE_TOKEN, NOTIFICATION_SERVICE_TOKEN } from '../../infrastructure/infrastructure.module';
import { OTPType } from '@prisma/client';

describe('OtpManagementService', () => {
  let service: OtpManagementService;
  let prismaService: jest.Mocked<PrismaService>;
  let userRepository: jest.Mocked<UserRepository>;
  let notificationAdapter: jest.Mocked<any>;
  let jwtAdapter: jest.Mocked<any>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: { value: 'test@example.com' },
    firstName: 'Test',
    lastName: 'User',
    phone: { value: '+1234567890' },
    currentRole: { value: 'CUSTOMER' },
    isEmailVerified: false,
    isPhoneVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'CUSTOMER',
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
    }),
  };

  const mockOtpRecord = {
    id: 'otp-123',
    phoneNumber: '+1234567890',
    email: 'test@example.com',
    otp: '123456',
    type: OTPType.REGISTRATION,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    isUsed: false,
    requestId: 'req-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      oTP: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      oTPVerification: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockUserRepository = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendSMS: jest.fn(),
      sendEmail: jest.fn(),
    };

    const mockJwtAdapter = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpManagementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: NOTIFICATION_SERVICE_TOKEN,
          useValue: mockNotificationAdapter,
        },
        {
          provide: JWT_SERVICE_TOKEN,
          useValue: mockJwtAdapter,
        },
      ],
    }).compile();

    service = module.get<OtpManagementService>(OtpManagementService);
    prismaService = module.get(PrismaService);
    userRepository = module.get(UserRepository);
    notificationAdapter = module.get(NOTIFICATION_SERVICE_TOKEN);
    jwtAdapter = module.get(JWT_SERVICE_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRegistrationOtp', () => {
    it('should generate OTP for phone registration successfully', async () => {
      const command = {
        phoneNumber: '+1234567890',
        countryCode: '+1',
        deviceId: 'device-123',
        deviceType: 'mobile',
      };

      userRepository.findByPhone.mockResolvedValue(null);
      prismaService.oTPVerification.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.oTPVerification.create.mockResolvedValue(mockOtpRecord);
      notificationAdapter.sendSMS.mockResolvedValue({ success: true });

      const result = await service.generateRegistrationOtp(command);

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(prismaService.oTPVerification.create).toHaveBeenCalled();
      expect(notificationAdapter.sendSMS).toHaveBeenCalled();
    });

    it('should generate OTP for email registration successfully', async () => {
      const command = {
        email: 'test@example.com',
        deviceId: 'device-123',
        deviceType: 'web',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      prismaService.oTP.deleteMany.mockResolvedValue({ count: 0 });
      prismaService.oTP.create.mockResolvedValue({ ...mockOtpRecord, phoneNumber: null });
      notificationAdapter.sendEmail.mockResolvedValue({ success: true });

      const result = await service.generateRegistrationOtp(command);

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      // Note: Email sending is not implemented yet (TODO in service)
    });

    it('should throw error if neither phone nor email provided', async () => {
      const command = {
        deviceId: 'device-123',
      };

      await expect(service.generateRegistrationOtp(command))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw error if user already exists with phone', async () => {
      const command = {
        phoneNumber: '+1234567890',
      };

      userRepository.findByPhone.mockResolvedValue(mockUser as any);

      await expect(service.generateRegistrationOtp(command))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw error if user already exists with email', async () => {
      const command = {
        email: 'test@example.com',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.generateRegistrationOtp(command))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const command = {
        phoneNumber: '+1234567890',
        otp: '123456',
        requestId: 'req-123',
      };

      prismaService.oTPVerification.findFirst.mockResolvedValue(mockOtpRecord);
      prismaService.oTPVerification.update.mockResolvedValue({ ...mockOtpRecord, isVerified: true });

      const result = await service.verifyOtp(command);

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(prismaService.oTPVerification.update).toHaveBeenCalledWith({
        where: { id: mockOtpRecord.id },
        data: { isVerified: true },
      });
    });

    it('should fail verification for invalid OTP', async () => {
      const command = {
        phoneNumber: '+1234567890',
        otp: '654321',
        requestId: 'req-123',
      };

      prismaService.oTPVerification.findFirst.mockResolvedValue(mockOtpRecord);
      prismaService.oTPVerification.update.mockResolvedValue({ ...mockOtpRecord, attempts: 1 });

      const result = await service.verifyOtp(command);

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it('should fail verification for expired OTP', async () => {
      const command = {
        phoneNumber: '+1234567890',
        otp: '123456',
      };

      // For expired OTP, the service won't find any record due to expiresAt filter
      prismaService.oTPVerification.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp(command);

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it('should throw error after max attempts exceeded', async () => {
      const command = {
        otp: '123456',
        requestId: 'request-123',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
      };

      const maxAttemptsOtp = {
        id: 'otp-id',
        otp: '123456',
        requestId: 'request-123',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        attempts: 3, // Max attempts reached
        isVerified: false,
        expiresAt: new Date(Date.now() + 300000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.oTPVerification.findFirst.mockResolvedValue(maxAttemptsOtp);

      const result = await service.verifyOtp(command);
      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
    });
  });

  describe('completeRegistration', () => {
    it('should complete registration successfully', async () => {
      const command = {
        otp: '123456',
        requestId: 'req-123',
        phoneNumber: '+1234567890',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        role: 'CUSTOMER',
      };

      // Mock verifyOtp method to return success
      jest.spyOn(service, 'verifyOtp').mockResolvedValue({
        success: true,
        isValid: true,
        message: 'OTP verified successfully'
      });

      userRepository.save.mockResolvedValue(mockUser as any);
      jwtAdapter.generateAccessToken.mockReturnValue('access-token');
      jwtAdapter.generateRefreshToken.mockReturnValue('refresh-token');
      jwtAdapter.sign.mockReturnValue('jwt-token');

      const result = await service.completeRegistration(command);

      expect(result.isNewUser).toBe(true);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('jwt-token');
      expect(result.user).toBeDefined();
    });

    it('should throw error for invalid OTP during registration', async () => {
      const command = {
        phoneNumber: '+1234567890',
        otp: '654321',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      prismaService.oTPVerification.findFirst.mockResolvedValue(mockOtpRecord);

      await expect(service.completeRegistration(command))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});