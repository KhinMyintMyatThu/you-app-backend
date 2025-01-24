import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from './entities/user.entity';
import {
  HttpException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ProfileDto } from './dto/profile.dto';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let userModel: any;

  beforeEach(async () => {
    const mockUserModel = {
      findOne: jest.fn(), // Mock for findOne
      create: jest.fn(),
      prototype: { save: jest.fn() }, // Mock for instance save method
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
    userModel = module.get(getModelToken(UserEntity.name));
  });

  describe('createUser', () => {
    it('should throw an error if username or password is empty', async () => {
      const createUserDto: CreateUserDto = {
        username: '',
        password: '',
        email: 'test@example.com',
      };

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw an error if password is less than 8 characters', async () => {
      const createUserDto: CreateUserDto = {
        username: 'test',
        password: 'short',
        email: 'test@example.com',
      };

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw an error if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'test',
        password: 'password123',
        email: 'test@example.com',
      };

      userModel.findOne.mockResolvedValueOnce({ email: 'test@example.com' });
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('login', () => {
    it('should throw an error if user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock findOne
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null), // User not found
      });

      // Throw an HttpException
      await expect(service.login(loginDto)).rejects.toThrow(HttpException);

      // Call findOne
      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
    });

    it('should throw an error if password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = { password: 'hashedpassword' };

      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user),
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(HttpException);
    });
  });

  describe('createProfile', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      // Mock userModel.findOne
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(), // Chainable select method
        exec: jest.fn().mockResolvedValue(null), // exec method resolving to null (user not found)
      });

      await expect(
        service.createProfile('nonexistent@example.com', {} as ProfileDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if profile already exists', async () => {
      // Mock initial findOne()
      const mockSelectExecChain = {
        select: jest.fn().mockReturnThis(), // Chain select() method
        exec: jest.fn().mockResolvedValue({ profile: {} }), // Final exec() method
      };

      // Mock userModel.findOne()
      userModel.findOne = jest.fn().mockReturnValue(mockSelectExecChain);

      // Call the method and check for InternalServerErrorException
      await expect(
        service.createProfile('test@example.com', {} as ProfileDto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should create and return the profile', async () => {
      const user = { profile: null, save: jest.fn() };

      const mockSelectExecChain = {
        select: jest.fn().mockReturnThis(), // Chain select() method
        exec: jest.fn().mockResolvedValue(user), // Final exec() method
      };
      // Mock userModel.findOne()
      userModel.findOne = jest.fn().mockReturnValue(mockSelectExecChain);
      
      user.save.mockResolvedValueOnce(user);

      const result = await service.createProfile('test@example.com', {
        name: 'John',
      } as ProfileDto);
      expect(result).toEqual(user);
    });
  });
});
