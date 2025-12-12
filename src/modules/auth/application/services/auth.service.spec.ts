import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/modules/users/application/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let otpService: jest.Mocked<OtpService>;

  beforeEach(async () => {
    const mockUserService = {
      getUserById: jest.fn(),
      getUserByPhoneNumber: jest.fn(),
      getUserByEmail: jest.fn(),
      createOrUpdateUser: jest.fn(),
      activateUser: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('test-token'),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_EXPIRATION: '1h',
          JWT_REFRESH_EXPIRATION: '7d',
          JWT_REFRESH_SECRET: 'refresh-secret',
        };
        return config[key];
      }),
    };

    const mockOtpService = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    otpService = module.get(OtpService) as jest.Mocked<OtpService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should request OTP for email', async () => {
      const email = 'test@example.com';
      const user = new UserEntity({ id: 'user-123', email, status: 'PENDING_VERIFICATION' });

      userService.createOrUpdateUser.mockResolvedValue(user);
      otpService.requestOtp.mockResolvedValue(undefined);

      await service.requestOtp(undefined, email);

      expect(userService.createOrUpdateUser).toHaveBeenCalledWith(undefined, email);
      expect(otpService.requestOtp).toHaveBeenCalledWith(email);
    });

    it('should throw error if neither phone nor email provided', async () => {
      await expect(service.requestOtp()).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      const user = new UserEntity({
        id: 'user-123',
        email,
        status: 'PENDING_VERIFICATION',
      });

      otpService.verifyOtp.mockResolvedValue(true);
      userService.getUserByEmail.mockResolvedValue(user);
      userService.activateUser.mockImplementation((u) =>
        Promise.resolve(new UserEntity({ ...u, status: 'ACTIVE' })),
      );

      const result = await service.verifyOtp(otp, undefined, email);

      expect(result.accessToken).toBe('test-token');
      expect(result.refreshToken).toBe('test-token');
      expect(otpService.verifyOtp).toHaveBeenCalledWith(email, otp);
    });

    it('should throw error if OTP is invalid', async () => {
      otpService.verifyOtp.mockResolvedValue(false);

      await expect(
        service.verifyOtp('wrong-otp', undefined, 'test@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error if user not found', async () => {
      otpService.verifyOtp.mockResolvedValue(true);
      userService.getUserByEmail.mockResolvedValue(null);

      await expect(
        service.verifyOtp('123456', undefined, 'test@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
