import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserEntity } from '../../domain/entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository) as jest.Mocked<UserRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const userId = 'user-123';
      const user = new UserEntity({
        id: userId,
        email: 'test@example.com',
        status: 'ACTIVE',
      });

      repository.findById.mockResolvedValue(user);

      const result = await service.getUserById(userId);

      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null if user not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create a new user if not exists', async () => {
      const email = 'new@example.com';
      repository.findByEmail.mockResolvedValue(null);
      repository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );

      const result = await service.createOrUpdateUser(undefined, email);

      expect(result.email).toBe(email);
      expect(result.status).toBe('PENDING_VERIFICATION');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should return existing user if found', async () => {
      const email = 'existing@example.com';
      const existingUser = new UserEntity({
        id: 'user-123',
        email,
        status: 'ACTIVE',
      });

      repository.findByEmail.mockResolvedValue(existingUser);

      const result = await service.createOrUpdateUser(undefined, email);

      expect(result).toEqual(existingUser);
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const userId = 'user-123';
      const user = new UserEntity({
        id: userId,
        email: 'test@example.com',
        status: 'PENDING_VERIFICATION',
      });

      repository.findById.mockResolvedValue(user);
      repository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.activateUser(userId);

      expect(result.status).toBe('ACTIVE');
      expect(repository.save).toHaveBeenCalled();
    });


  });
});
