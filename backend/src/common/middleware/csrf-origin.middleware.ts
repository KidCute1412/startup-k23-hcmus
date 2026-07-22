import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { getAccessTokenFromRequest } from '../../modules/auth/auth-cookie';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfOriginMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (!MUTATING_METHODS.has(req.method) || !getAccessTokenFromRequest(req)) {
      next();
      return;
    }

    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const origin = req.get('origin');

    if (!origin || !allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Invalid or missing request origin');
    }

    next();
  }
}
