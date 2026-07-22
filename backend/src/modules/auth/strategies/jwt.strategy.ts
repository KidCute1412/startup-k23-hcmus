import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { JwtPayload } from '../../../common/types/authentication';
import { getAccessTokenFromRequest } from '../auth-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (request: Request) =>
        getAccessTokenFromRequest(request) ?? null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretTokenForWeek1Dev',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
