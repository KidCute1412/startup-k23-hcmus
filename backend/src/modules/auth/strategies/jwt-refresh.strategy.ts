import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import type {
  JwtPayload,
  RefreshJwtPayload,
} from '../../../common/types/authentication';
import { getRefreshTokenFromRequest } from '../auth-cookie';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: (request: Request) =>
        getRefreshTokenFromRequest(request) ?? null,
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ||
        'fallbackRefreshSecretTokenForWeek1Dev',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshJwtPayload {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie missing');
    }
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
