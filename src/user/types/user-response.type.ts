import { UserEntity } from '../entities/user.entity';

// export type UserResponseType =  {userEntity?: // Omit<UserEntity, 'password'> access_token: string}
export type UserResponseType = {
  message?: string;
  access_token?: string;
};
