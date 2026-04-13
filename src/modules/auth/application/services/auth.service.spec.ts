import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let otpService: jest.Mocked<OtpService>;

  beforeEach(async () => {
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
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    otpService = module.get(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should request OTP for email', async () => {
      const email = 'test@example.com';

      otpService.requestOtp.mockResolvedValue(undefined);

      await service.requestOtp(undefined, email);

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

      otpService.verifyOtp.mockResolvedValue(true);

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

    it('should throw error if neither phone nor email provided', async () => {
      await expect(service.verifyOtp('123456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
