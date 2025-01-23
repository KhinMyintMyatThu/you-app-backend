import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserEntity } from './entities/user.entity';
import { Model } from 'mongoose';
import { UserResponseType } from './types/user-response.type';
import { LoginDto } from './dto/login.dto';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { ProfileResponseType } from './types/profile-response.type';
import { ProfileEntity } from './entities/profile.entity';
import { ProfileDto } from './dto/profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    let message = [];
    if (!createUserDto.username || createUserDto.username == '') {
      message.push('Username should not be empty');
    }
    if (!createUserDto.password || createUserDto.password == '') {
      message.push('Password should not be empty');
    }
    if (createUserDto.password.length < 8) {
      message.push('Password must be longer than or equal to 8 characters');
    }

    if (message.length > 0) {
      throw new HttpException(
        {
          statusCode: 400,
          message: message,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userModel.findOne({ email: createUserDto.email });

    if (user) {
      throw new HttpException(
        'User already exists',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const createUser = new this.userModel(createUserDto);
    return createUser.save();
  }

  async login(loginDto: LoginDto): Promise<UserEntity> {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');

    if (!user) {
      throw new HttpException(
        'User not found',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordCorrect = await compare(loginDto.password, user.password);
    if (!isPasswordCorrect) {
      throw new HttpException(
        'Incorrect password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }

  async createProfile(email: string, createProfileDto: ProfileDto) {
    const user = await this.userModel
      .findOne({ email: email })
      .select('+password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure profile doesn't already exist
    if (user.profile) {
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Internal server error',
      });
    }

    user.profile = createProfileDto;
    return user.save();
  }

  async updateProfile(
    email: string,
    profileDto: ProfileDto,
  ): Promise<UserEntity> {
    const user = await this.userModel.findOne({ email: email }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update the profile fields
    Object.assign(user.profile, profileDto);
    return user.save();
  }

  async getProfile(email: string): Promise<UserEntity> {
    const user = await this.userModel
      .findOne({ email: email })
      .select('+password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      throw new NotFoundException('Profile not found');
    }

    return user;
  }

  buildUserResponse(
    message?: string,
    userEntity?: UserEntity,
  ): UserResponseType {
    if (userEntity) {
      return {
        message: message,
        access_token: this.generateJwt(userEntity),
      };
    }
    return {
      message: message,
    };
  }

  buildProfileResponse(
    message?: string,
    userEntity?: UserEntity,
  ): ProfileResponseType {
    const profileEntity = userEntity.profile;
    return {
      message: message,
      data: {
        email: userEntity.email,
        username: userEntity.username,
        name: profileEntity.name,
        birthday: profileEntity.birthday,
        horoscope: profileEntity.horoscope,
        zodiac: profileEntity.zodiac,
        height: profileEntity.height,
        weight: profileEntity.weight,
        interests: profileEntity.interests,
      },
    };
  }

  generateJwt(userEntity: UserEntity): string {
    return sign({ email: userEntity.email }, 'JWT_SECRET');
  }

  // Find a user by username
  async findByEmail(email: string): Promise<UserEntity> {
    return this.userModel.findOne({ email });
  }

  // Find a user by username
  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ username }).exec();
  }
}
