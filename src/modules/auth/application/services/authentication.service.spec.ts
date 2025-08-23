import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { UserRepository } from '../../domain/repositories';
import { AuthenticationDomainService } from '../../domain/services/authentication-domain.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email, Password } from '../../domain/value-objects';
import { UserRole } from '../../domain/enums';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: jest.Mocked<UserRepository>;
  let authDomainService: jest.Mocked<AuthenticationDomainService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: Email.create('test@example.com'),
    name: 'Test User',
    role: UserRole.CUSTOMER,
    validatePassword: jest.fn(),
    addRefreshToken: jest.fn(),
    getFirstName: jest.fn().mockReturnValue('Test'),
    getLastName: jest.fn().mockReturnValue('User'),
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

    const mockAuthDomainService = {
      generateTokens: jest.fn(),
      validateRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: AuthenticationDomainService,
          useValue: mockAuthDomainService,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userRepository = module.get(UserRepository);
    authDomainService = module.get(AuthenticationDomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    const registerCommand = {
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'Password123!',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    it('should register a new user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser);
      authDomainService.generateTokens.mockResolvedValue(mockTokens);

      // Mock User.create static method
      jest.spyOn(User, 'create').mockResolvedValue(mockUser);

      const result = await service.registerUser(registerCommand);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(Email.create(registerCommand.email));
      expect(userRepository.findByPhone).toHaveBeenCalledWith(registerCommand.phone);
      expect(User.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(authDomainService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email.value,
          name: mockUser.name,
          role: mockUser.currentRole.value,
        },
        tokens: mockTokens,
      });
    });

    it('should throw BadRequestException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerCommand)).rejects.toThrow(
        new BadRequestException('User with this email already exists')
      );
    });

    it('should throw BadRequestException when phone already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerCommand)).rejects.toThrow(
        new BadRequestException('User with this phone number already exists')
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
        new BadRequestException('Invalid role specified')
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
      userRepository.save.mockResolvedValue(mockUser);
      authDomainService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.loginUser(loginCommand);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(Email.create(loginCommand.email));
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginCommand.password);
      expect(mockUser.addRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email.value,
          firstName: 'Test',
          lastName: 'User',
          role: mockUser.currentRole.value,
        },
        tokens: mockTokens,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.loginUser(loginCommand)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUser.validatePassword.mockResolvedValue(false);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.loginUser(loginCommand)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });
  });

  describe('refreshToken', () => {
    const refreshCommand = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh token successfully', async () => {
      userRepository.findByRefreshToken.mockResolvedValue(mockUser);
      authDomainService.validateRefreshToken.mockResolvedValue(true);
      authDomainService.generateTokens.mockResolvedValue(mockTokens);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.refreshToken(refreshCommand);

      expect(userRepository.findByRefreshToken).toHaveBeenCalledWith(refreshCommand.refreshToken);
      expect(authDomainService.validateRefreshToken).toHaveBeenCalledWith(refreshCommand.refreshToken);
      expect(authDomainService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      userRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshCommand)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token')
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

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.logoutUser(logoutCommand)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });
  });


  });

  describe('getProfile', () => {
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

      const result = await service.getProfile(getProfileCommand);

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

      const result = await service.getProfile(getProfileCommand);

      expect(result).toEqual({
        success: false,
        error: 'User not found',
      });
    });
  });
});