import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from '../../domain/repositories';
import { UserManagementDomainService } from '../../domain/services/user-management-domain.service';
import { OtpSecurityAdapter } from './otp-security.adapter';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../domain/entities/user.entity';
import { Email, Password, Phone, UserRole } from '../../domain/value-objects';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: jest.Mocked<UserRepository>;
  let userManagementService: jest.Mocked<UserManagementDomainService>;
  let jwtService: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: Email.create('test@example.com'),
    name: 'Test User',
    role: UserRole.create('CUSTOMER'),
    currentRole: UserRole.create('CUSTOMER'),
    validatePassword: jest.fn(),
    addRefreshToken: jest.fn(),
    getFirstName: jest.fn().mockReturnValue('Test'),
    getLastName: jest.fn().mockReturnValue('User'),
    removeRefreshToken: jest.fn(),
    clearAllRefreshTokens: jest.fn(),
    recordLogin: jest.fn(),
  } as any;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      findByRefreshToken: jest.fn(),
      removeRefreshToken: jest.fn(),
      clearAllRefreshTokens: jest.fn(),
    };

    const mockUserManagementService = {
      authenticateUser: jest.fn(),
      registerUser: jest.fn(),
      validatePasswordChange: jest.fn(),
      analyzePasswordStrength: jest.fn(),
      validateTokenRefreshEligibility: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockOtpSecurityAdapter = {
      registerOtp: jest.fn(),
      verifyOtp: jest.fn(),
      completeRegistration: jest.fn(),
      loginOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserManagementDomainService,
          useValue: mockUserManagementService,
        },
        {
          provide: 'JWT_SERVICE',
          useValue: mockJwtService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: OtpSecurityAdapter,
          useValue: mockOtpSecurityAdapter,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userRepository = module.get(UserRepository);
    userManagementService = module.get(UserManagementDomainService);
    jwtService = module.get('JWT_SERVICE');
    
    // Mock console.error to suppress output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const registerCommand = {
      email: 'test@example.com',
      phone: '1234567890',
      countryCode: '+1',
      password: 'Password123!',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser);
      // Note: UserManagementDomainService doesn't have generateTokens method
      // This test needs to be updated to match the actual service implementation

      // Mock User.create static method
      jest.spyOn(User, 'create').mockResolvedValue(mockUser);
      
      // Mock JWT service for token generation
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken).mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.registerUser(registerCommand);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(Email.create(registerCommand.email), { includeInactive: true });
      const expectedPhoneValue = Phone.fromParts(registerCommand.countryCode!, registerCommand.phone).value;
      expect(userRepository.findByPhone).toHaveBeenCalledWith(expectedPhoneValue, { includeInactive: true });
      expect(User.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      // Note: Test expectation needs to be updated for UserManagementDomainService
      expect(result).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(Object),
        }),
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw BadRequestException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerCommand)).rejects.toThrow(
        new BadRequestException('Registration failed')
      );
    });

    it('should throw BadRequestException when phone already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerCommand)).rejects.toThrow(
        new BadRequestException('Registration failed')
      );
    });

    it('should throw BadRequestException for invalid role', async () => {
      const invalidRoleCommand = {
        ...registerCommand,
        role: 'INVALID_ROLE',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);

      await expect(service.registerUser(invalidRoleCommand)).rejects.toThrow(
        new BadRequestException('Registration failed')
      );
    });
  });

  describe('loginUser', () => {
    const loginCommand = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      mockUser.validatePassword.mockResolvedValue(true);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userManagementService.authenticateUser.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken).mockReturnValueOnce(mockTokens.refreshToken);
      mockUser.addRefreshToken = jest.fn();
      mockUser.recordLogin = jest.fn();

      const result = await service.loginUser(loginCommand);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(Email.create(loginCommand.email), { includeUnverified: true });
      expect(userManagementService.authenticateUser).toHaveBeenCalledWith(mockUser, loginCommand.password);
      expect(mockUser.recordLogin).toHaveBeenCalled();
      expect(mockUser.addRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(Object),
        }),
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.loginUser(loginCommand)).rejects.toThrow(
        new UnauthorizedException('Login failed')
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userManagementService.authenticateUser.mockRejectedValue(new Error('Invalid password'));

      await expect(service.loginUser(loginCommand)).rejects.toThrow(
        new UnauthorizedException('Login failed')
      );
    });
  });

  describe('refreshToken', () => {
    const refreshCommand = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      userRepository.findByRefreshToken.mockResolvedValue(mockUser);
      userManagementService.validateTokenRefreshEligibility.mockResolvedValue(true);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken).mockReturnValueOnce(mockTokens.refreshToken);
      userRepository.save.mockResolvedValue(mockUser);
      mockUser.addRefreshToken = jest.fn();

      const result = await service.refreshToken(refreshCommand);

      expect(userRepository.findByRefreshToken).toHaveBeenCalledWith(refreshCommand.refreshToken);
      expect(userManagementService.validateTokenRefreshEligibility).toHaveBeenCalledWith(mockUser, refreshCommand.refreshToken);
      expect(mockUser.addRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      userRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshCommand)).rejects.toThrow(
        new UnauthorizedException('Token refresh failed')
      );
    });
  });

  describe('logoutUser', () => {
    const logoutCommand = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      refreshToken: 'valid-refresh-token',
    };

    it('should logout user successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      mockUser.clearAllRefreshTokens = jest.fn();

      const result = await service.logoutUser(logoutCommand);

      expect(userRepository.findById).toHaveBeenCalledWith(logoutCommand.userId);
      expect(mockUser.clearAllRefreshTokens).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        success: true,
        message: 'Successfully logged out',
      });
    });

    it('should return failure result when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.logoutUser(logoutCommand);

      expect(result).toEqual({
        success: false,
        message: 'Failed to logout user',
      });
    });
  });

  describe('getUserProfile', () => {
    const getProfileCommand = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('should get user profile successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      mockUser.firstName = 'Test';
      mockUser.lastName = 'User';
      mockUser.phone = { value: '+1234567890' };
      mockUser.isEmailVerified = true;
      mockUser.isPhoneVerified = false;

      const result = await service.getUserProfile(getProfileCommand);

      expect(userRepository.findById).toHaveBeenCalledWith(getProfileCommand.userId);
      expect(result).toEqual({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email.value,
          name: 'Test User',
          role: mockUser.currentRole.value,
          phone: '+1234567890',
          isEmailVerified: true,
          isPhoneVerified: false,
        },
      });
    });

    it('should return error when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.getUserProfile(getProfileCommand);

      expect(result).toEqual({
        success: false,
        error: 'User not found',
      });
    });
  });
});