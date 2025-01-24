import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseType } from './types/user-response.type';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileDto } from './dto/profile.dto';
import { ProfileResponseType } from './types/profile-response.type';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from './entities/user.entity';
import { ProfileEntity } from './entities/profile.entity';
import { UserController } from './user.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let userModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getModelToken(UserEntity.name),
          useValue: Model, // Mock the Mongoose Model
        },
        {
          provide: getModelToken(ProfileEntity.name),
          useValue: Model,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userModel = module.get(getModelToken(UserEntity.name));
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'test',
      };
      const mockUser = { email: createUserDto.email } as UserEntity;
      const mockResponse = { message: 'User has been created successfully' };

      jest.spyOn(userService, 'createUser').mockResolvedValue(mockUser);
      jest
        .spyOn(userService, 'buildUserResponse')
        .mockReturnValue(mockResponse);

      const result = await controller.createUser(createUserDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = { email: loginDto.email } as UserEntity;
      const mockResponse = {
        message: 'UserEntity has been logged in successfully',
        user: mockUser,
      };

      jest.spyOn(userService, 'login').mockResolvedValue(mockUser);
      jest
        .spyOn(userService, 'buildUserResponse')
        .mockReturnValue(mockResponse);

      const result = await controller.login(loginDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createProfile (authorized)', () => {
    it('should create a user profile successfully', async () => {
      const email = 'test@example.com';
      const profileDto: ProfileDto = {
        name: 'John',
        birthday: '',
        height: 0,
        weight: 0,
        interests: [],
        horoscope: '',
        zodiac: '',
      };

      const mockUser = { email, profile: {} } as UserEntity;
      const mockProfile = { ...profileDto, email };
      const mockResponse = {
        message: 'Profile has been created successfully',
        data: {
          email: '',
          username: '',
          name: '',
          birthday: '',
          horoscope: '',
          zodiac: '',
          height: 0,
          weight: 0,
          interests: [],
        },
      };
    
      const req = { user: { email } } as any; // Mocked request with email
    
      // Mock the userModel.findOne
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(), // Chainable select method
        exec: jest.fn().mockResolvedValue(mockUser), // exec method resolving to the mocked user
      });
    
      // Focus on the interaction with buildProfileResponse
      const buildProfileResponseSpy = jest.spyOn(userService, 'buildProfileResponse');
      buildProfileResponseSpy.mockReturnValue(mockResponse); // Mock the response function
    
      const result = await controller.getProfile(req);
    
      expect(buildProfileResponseSpy).toHaveBeenCalledWith(
        'Profile has been found successfully',
        expect.objectContaining({
          // Check with partial match
          email: mockProfile.email,
          profile: {}
        }),
      );
    
      expect(result).toEqual(mockResponse);
    });
    
  });

  describe('getProfile (authorized)', () => {
    it('should get a user profile successfully', async () => {
      const email = 'test@example.com';
      const mockUser = { email } as UserEntity;
      const mockProfile = { ...mockUser, username: '' };
      const mockResponse = {
        message: 'ProfileEntity has been found successfully',
        data: {
          email: '',
          username: '',
          name: '',
          birthday: '',
          horoscope: '',
          zodiac: '',
          height: 0,
          weight: 0,
          interests: [],
        },
      };

      const req = { user: { email } } as any;

      jest.spyOn(userService, 'getProfile').mockResolvedValue(Promise.resolve(mockProfile));
      jest.spyOn(userService, 'buildProfileResponse')
        .mockReturnValue(mockResponse);

      const result = await controller.getProfile(req);
      expect(result).toEqual(mockResponse);
    });
  });
});
