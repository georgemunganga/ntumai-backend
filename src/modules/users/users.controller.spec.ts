import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards';
import { SwitchRoleDto } from '../auth/dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CUSTOMER',
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockUsersService = {
    switchRole: jest.fn(),
    registerForRole: jest.fn(),
    getUserRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('switchRole', () => {
    it('should allow a user to switch roles if they have the right to do so', async () => {
      const switchRoleDto: SwitchRoleDto = {
        targetRole: 'DRIVER',
        otpCode: '123456',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
      };

      const mockRequest = { user: mockUser };

      const expectedResult = {
        success: true,
        message: 'Role switched successfully',
        user: {
          id: 'user-123',
          name: 'John Doe',
          currentRole: 'DRIVER',
          availableRoles: ['CUSTOMER', 'DRIVER'],
        },
      };

      mockUsersService.switchRole.mockResolvedValue(expectedResult);

      const result = await controller.switchRole(switchRoleDto, mockRequest);

      expect(usersService.switchRole).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', switchRoleDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('registerRole', () => {
    it('should register user for a new role', async () => {
      const switchRoleDto: SwitchRoleDto = {
        targetRole: 'driver',
        otpCode: '123456',
        phoneNumber: '+1234567890',
      };
      const mockRequest = { user: mockUser };
      const expectedResult = {
        success: true,
        message: 'Successfully registered for driver role',
        role: 'driver',
      };

      mockUsersService.registerForRole.mockResolvedValue(expectedResult);

      const result = await controller.registerRole(switchRoleDto, mockRequest);

      expect(usersService.registerForRole).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'driver',
        '123456',
        '+1234567890',
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserRoles', () => {
    it('should return user available roles', async () => {
      const mockRequest = { user: mockUser };
      const expectedResult = {
        success: true,
        user: {
          id: 'user-123',
          name: 'John Doe',
          phoneNumber: '+1234567890',
          email: 'john@example.com',
          currentRole: 'customer',
          availableRoles: ['customer', 'driver'],
        },
      };

      mockUsersService.getUserRoles.mockResolvedValue(expectedResult);

      const result = await controller.getUserRoles(mockRequest);

      expect(usersService.getUserRoles).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(expectedResult);
    });
  });
});