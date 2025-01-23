import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { ProfileDto } from './dto/profile.dto';
import { ProfileEntity } from './entities/profile.entity';
import { Model } from 'mongoose';

describe('UserService', () => {
  let service: UserService;
  let userModel: jest.Mocked<Model<UserEntity>>;

  beforeEach(async () => {
    const mockUserModel = {
      save: jest.fn(),
      // Mock the save method on the returned document from findOne
      findOne: jest.fn().mockResolvedValue({
        save: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(UserEntity.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<jest.Mocked<Model<UserEntity>>>(getModelToken(UserEntity.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException if user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.updateProfile('test@test.com', {} as ProfileDto)).rejects.toThrow(NotFoundException);
    });

    it('should update profile successfully', async () => {
      const mockUser = {
        email: 'test@test.com',
        profile: {} as ProfileEntity,
        save: jest.fn().mockResolvedValue({ email: 'test@test.com', profile: { name: 'test' } }), // Mock save here
        toObject: jest.fn().mockReturnValue({email: 'test@test.com', profile: {name: 'test'}}) // Mock toObject
      };
    
      userModel.findOne.mockResolvedValue(mockUser);
    
      const profileDto: ProfileDto = { name: 'test' } as ProfileDto;
      const result = await service.updateProfile('test@test.com', profileDto);
    
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockUser.profile).toEqual(profileDto);
    
      // Await updateProfile and access the resolved user object
      const savedUser = await mockUser.save();
      expect(savedUser).toEqual({ email: 'test@test.com', profile: { name: 'test' } }); // Assert on the saved user
    });
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);
      await expect(service.getProfile('test@test.com')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if profile is not found', async () => {
      const mockUser = { email: 'test@test.com', profile: null } as unknown as UserEntity;
      userModel.findOne.mockResolvedValue(mockUser);
      await expect(service.getProfile('test@test.com')).rejects.toThrow(NotFoundException);
    });

    it('should return profile successfully', async () => {
      const mockProfile = { name: 'test' } as ProfileEntity;
      const mockUser = { email: 'test@test.com', profile: mockProfile } as unknown as UserEntity;
      userModel.findOne.mockResolvedValue(mockUser);
      const result = await service.getProfile('test@test.com');
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(result).toEqual(mockUser);
    });
  });
});