import {
  Injectable,
  InternalServerErrorException,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UserEntity } from '../entities/user.entity';
import { verify } from 'jsonwebtoken';
import { UserService } from '../user.service';

export interface ExpressRequest extends Request {
  user?: UserEntity;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private userService: UserService) {}

  async use(req: ExpressRequest, res: Response, next: NextFunction) {
    if (!req.headers['x-access-token']) {
      req.user = null;
      throw new UnauthorizedException({
        auth: false,
        message: 'No token provided.',
      });
    }

    const token = req.headers['x-access-token'];

    try {
      const decode = verify(token, 'JWT_SECRET') as { email: string };
      const user = await this.userService.findByEmail(decode.email);
      req.user = user;
      next();
    } catch (err) {
      req.user = null;
      throw new InternalServerErrorException({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
