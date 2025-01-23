import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserResponseType } from './types/user-response.type';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ExpressRequest } from './middlewares/auth.middleware';
import { ProfileDto } from './dto/profile.dto';
import { ProfileResponseType } from './types/profile-response.type';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('api') 
@Controller('api')
export class UserController {
  constructor(private userService: UserService) {}

  // Register
  @Post('register')
  @ApiOperation({ summary: 'User registration' }) // Operation summary
  @ApiResponse({ status: 201, description: 'Created user' }) // Response details
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 422, description: 'User already exists' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseType> {
    console.log('create user dto', createUserDto);
    const user = await this.userService.createUser(createUserDto);
    return this.userService.buildUserResponse(
      'User has been created successfully',
    );
  }

  // Login
  @Post('login')
  @ApiOperation({ summary: 'User login' }) // Operation summary
  @ApiResponse({ status: 201, description: 'Success' }) // Response details
  @ApiResponse({ status: 422, description: 'User not found or incorrect password' })
  async login(@Body() loginDto: LoginDto): Promise<UserResponseType> {
    console.log('create user dto', loginDto);
    const user = await this.userService.login(loginDto);
    return this.userService.buildUserResponse(
      'User has been logged in successfully',
      user,
    );
  }

  // API to create a user profile
  @Post('createProfile')
  @ApiOperation({ summary: 'Create user profile' }) // Operation summary
  @ApiResponse({ status: 201, description: 'Created' }) // Response details
  @ApiResponse({ status: 500, description: 'Internal server' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'Access token',
    required: false,
  })
  async createProfile(
    @Request() request: ExpressRequest,
    @Body() createProfileDto: ProfileDto,
  ) {
    const email = request.user.email;
    const user = await this.userService.createProfile(email, createProfileDto);
    return this.userService.buildProfileResponse(
      'Profile has been created successfully',
      user,
    );
  }

  // API to get a user profile
  @Get('getProfile')
  @ApiOperation({ summary: 'Get user profile' }) // Operation summary
  @ApiResponse({ status: 200, description: 'Success' }) // Response details
  @ApiResponse({ status: 404, description: 'User not found or profile not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'Access token',
    required: false,
  })
  async getProfile(
    @Request() request: ExpressRequest,
  ): Promise<ProfileResponseType> {
    const email = request.user.email;
    const user = await this.userService.getProfile(email);
    return this.userService.buildProfileResponse(
      'Profile has been found successfully',
      user,
    );
  }

  // API to update a user profile
  @Patch('updateProfile')
  @ApiOperation({ summary: 'Get update profile' }) // Operation summary
  @ApiResponse({ status: 200, description: 'Success' }) // Response details
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({
    name: 'x-access-token',
    description: 'Access token',
    required: false,
  })
  async updateProfile(
    @Request() request: ExpressRequest,
    @Body() profileDto: ProfileDto,
  ) {
    const email = request.user.email;
    const user = await this.userService.updateProfile(email, profileDto);
    return this.userService.buildProfileResponse(
      'Profile has been updated successfully',
      user,
    );
  }
}
