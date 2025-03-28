import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { User } from './user/entities/user.entity';

interface JwtUserData extends User {}

declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requireLogin = this.reflector.getAllAndOverride('require-login', [
        context.getClass(),
        context.getHandler(),
      ]);

      if (!requireLogin) {
        return true;
      }
      const request: Request = context.switchToHttp().getRequest();

      const authorization = request.headers.authorization;

      if (!authorization) {
        throw new UnauthorizedException('用户未登录');
      }

      // const token = authorization.split(' ');

      const data = this.jwtService.verify<JwtUserData>(authorization);

      request.user = data;

      return true;
    } catch (error) {
      throw new UnauthorizedException('token 失效，请重新登录');
    }
  }
}
