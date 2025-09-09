import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserToken } from 'src/modules/user-token/entities/user-token.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserToken)
    private readonly tokenRepository: Repository<UserToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('UNAUTHENTICATED ');
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
      ) as jwt.JwtPayload;
      const userToken = await this.tokenRepository.findOne({
        where: {
          user: { id: decoded.id },
          token,
        },
        relations: ['user'],
      });
      if (!userToken) {
        throw new UnauthorizedException('UNAUTHENTICATED ');
      }
      request['user'] = userToken.user;
      return true;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('TOKEN_EXPIRED ');
      }
      throw new UnauthorizedException('UNAUTHENTICATED ');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
