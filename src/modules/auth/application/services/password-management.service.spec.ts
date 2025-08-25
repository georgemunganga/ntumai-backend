import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordManagementService } from './password-management.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserManagementDomainService } from '../../domain/services/user-management-domain.service';
import { PasswordChangedEvent } from '../../domain/events';

describe('PasswordManagementService', () => {
  let service: PasswordManagementService;
  let userRepository: jest.Mocked<UserRepository>;
  let userManagementService: jest.Mocked<UserManagementDomainService>;
  let notificationService: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: { value: 'test@example.com' },
    firstName: 'Test',
    lastName: 'User',
    phone: { value: '+1234567890' },
    currentRole: { value: 'CUSTOMER' },
    validatePassword: jest.fn(),
    changePassword: jest.fn(),
    setPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'CUSTOMER',
    }),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByResetToken: jest.fn(),
      save: jest.fn(),
      clearAllRefreshTokens: jest.fn(),
    };

    const mockUserManagementService = {
      validatePasswordChange: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      validatePasswordResetToken: jest.fn(),
    };

    const mockNotificationService = {
      sendPasswordResetEmail: jest.fn(),
      sendPasswordChangedNotification: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordManagementService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserManagementDomainService,
          useValue: mockUserManagementService,
        },
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: mockNotificationService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PasswordManagementService>(PasswordManagementService);
    userRepository = module.get(UserRepository);
    userManagementService = module.get(UserManagementDomainService);
    notificationService = module.get('NOTIFICATION_SERVICE');
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const command = {
        userId: mockUser.id,
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123!',
      };

      // Mock user validation
      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(mockUser, 'changePassword').mockImplementation(() => {});
      
      userRepository.findById.mockResolvedValue(mockUser);
      userManagementService.validatePasswordChange.mockResolvedValue({
        isValid: true,
        message: 'Password is valid',
      });
      userRepository.save.mockResolvedValue(mockUser);
      notificationService.sendPasswordChangedNotification.mockResolvedValue(undefined);

      const result = await service.changePassword(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(notificationService.sendPasswordChangedNotification).toHaveBeenCalledWith(mockUser.email.value);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'password.changed',
        expect.any(PasswordChangedEvent)
      );
    });

    it('should fail when user not found', async () => {
      const command = {
        userId: 'non-existent-id',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123!',
      };

      userRepository.findById.mockResolvedValue(null);

      const result = await service.changePassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should fail when current password is invalid', async () => {
      const command = {
        userId: mockUser.id,
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
      };

      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(false);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.changePassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
    });

    it('should fail when new password is invalid', async () => {
      const command = {
        userId: mockUser.id,
        currentPassword: 'currentPassword',
        newPassword: 'weak',
      };

      jest.spyOn(mockUser, 'validatePassword').mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(mockUser);
      userManagementService.validatePasswordChange.mockResolvedValue({
        isValid: false,
        message: 'Password must be at least 8 characters long',
      });

      const result = await service.changePassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters long');
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset successfully', async () => {
      const command = {
        email: 'test@example.com',
      };

      const resetToken = 'reset-token-123';
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userManagementService.generatePasswordResetToken.mockResolvedValue(resetToken);
      jest.spyOn(mockUser, 'setPasswordResetToken').mockImplementation(() => {});
      userRepository.save.mockResolvedValue(mockUser);
      notificationService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
      expect(mockUser.setPasswordResetToken).toHaveBeenCalledWith(resetToken);
      expect(notificationService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email.value,
        resetToken
      );
    });

    it('should fail silently when user not found (security)', async () => {
      const command = {
        email: 'nonexistent@example.com',
      };

      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset email sent');
      expect(notificationService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const command = {
        token: 'valid-reset-token',
        newPassword: 'newPassword123!',
      };

      userRepository.findByResetToken.mockResolvedValue(mockUser);
      userManagementService.validatePasswordResetToken.mockResolvedValue({
        isValid: true,
        message: 'Token is valid',
      });
      jest.spyOn(mockUser, 'resetPassword').mockImplementation(() => {});
      userRepository.save.mockResolvedValue(mockUser);
      userRepository.clearAllRefreshTokens.mockResolvedValue(undefined);
      notificationService.sendPasswordChangedNotification.mockResolvedValue(undefined);

      const result = await service.resetPassword(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password reset successfully');
      expect(mockUser.resetPassword).toHaveBeenCalledWith(command.newPassword);
      expect(userRepository.clearAllRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(notificationService.sendPasswordChangedNotification).toHaveBeenCalledWith(mockUser.email.value);
    });

    it('should fail when reset token is invalid', async () => {
      const command = {
        token: 'invalid-token',
        newPassword: 'newPassword123!',
      };

      userRepository.findByResetToken.mockResolvedValue(null);

      const result = await service.resetPassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired reset token');
    });

    it('should fail when token validation fails', async () => {
      const command = {
        token: 'expired-token',
        newPassword: 'newPassword123!',
      };

      userRepository.findByResetToken.mockResolvedValue(mockUser);
      userManagementService.validatePasswordResetToken.mockResolvedValue({
        isValid: false,
        message: 'Token has expired',
      });

      const result = await service.resetPassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token has expired');
    });

    it('should handle errors gracefully', async () => {
      const command = {
        token: 'valid-token',
        newPassword: 'newPassword123!',
      };

      userRepository.findByResetToken.mockRejectedValue(new Error('Database error'));

      const result = await service.resetPassword(command);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to reset password');
    });
  });
});