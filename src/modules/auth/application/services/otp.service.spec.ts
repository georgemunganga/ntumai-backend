import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { RedisService } from '../../../shared/infrastructure/redis.service';
import { CommunicationsService } from '../../../modules/communications/communication.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisService: RedisService;
  let communicationService: CommunicationsService;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockCommunicationsService = {
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: CommunicationsService, useValue: mockCommunicationsService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    redisService = module.get<RedisService>(RedisService);
    communicationService =
      module.get<CommunicationsService>(CommunicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtp', () => {
    it('should generate, store, and send an OTP', async () => {
      const identifier = '1234567890';

      // Mock Math.random to return a fixed value for predictable OTP
      jest.spyOn(global.Math, 'random').mockReturnValue(0.123456);
      const expectedOtp = '123456';

      await service.requestOtp(identifier);

      expect(redisService.set).toHaveBeenCalledWith(
        `otp:${identifier}`,
        expectedOtp,
        'EX',
        300,
      );
      expect(communicationService.sendOtp).toHaveBeenCalledWith(
        identifier,
        expectedOtp,
      );

      // Restore Math.random
      jest.spyOn(global.Math, 'random').mockRestore();
    });
  });

  describe('verifyOtp', () => {
    const identifier = '1234567890';
    const validOtp = '123456';
    const invalidOtp = '999999';

    it('should return true and delete OTP if valid', async () => {
      mockRedisService.get.mockResolvedValue(validOtp);

      const result = await service.verifyOtp(identifier, validOtp);

      expect(result).toBe(true);
      expect(redisService.del).toHaveBeenCalledWith(`otp:${identifier}`);
    });

    it('should return false if OTP is invalid', async () => {
      mockRedisService.get.mockResolvedValue(validOtp);

      const result = await service.verifyOtp(identifier, invalidOtp);

      expect(result).toBe(false);
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should return false if OTP is expired or not found', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.verifyOtp(identifier, validOtp);

      expect(result).toBe(false);
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
