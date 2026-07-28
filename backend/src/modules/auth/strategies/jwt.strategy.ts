import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { JwtPayload } from '../../../common/types/authentication';
import { getAccessTokenFromRequest } from '../auth-cookie';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: (request: Request) =>
        getAccessTokenFromRequest(request) ?? null,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallbackSecretTokenForWeek1Dev',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { is_active: true },
    });
    if (!user?.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  }
}
