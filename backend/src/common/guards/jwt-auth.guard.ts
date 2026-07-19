import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: unknown,
    user: TUser | false | null,
    _info: unknown,
  ): TUser {
    if (err instanceof Error) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
    return user;
  }
}
