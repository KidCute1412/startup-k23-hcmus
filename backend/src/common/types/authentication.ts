import type { UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RefreshJwtPayload extends JwtPayload {
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface RefreshAuthenticatedRequest extends Request {
  user: RefreshJwtPayload;
}
