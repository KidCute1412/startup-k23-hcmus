import type { Request } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const ACCESS_TOKEN_COOKIE_PATH = '/api/v1';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  path: ACCESS_TOKEN_COOKIE_PATH,
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  path: REFRESH_TOKEN_COOKIE_PATH,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const accessTokenClearCookieOptions = {
  ...baseCookieOptions,
  path: ACCESS_TOKEN_COOKIE_PATH,
};

export const refreshTokenClearCookieOptions = {
  ...baseCookieOptions,
  path: REFRESH_TOKEN_COOKIE_PATH,
};

function getCookieFromRequest(
  req: Request,
  cookieName: string,
): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookie) return undefined;

  try {
    return decodeURIComponent(cookie.slice(cookieName.length + 1));
  } catch {
    return undefined;
  }
}

export function getAccessTokenFromRequest(req: Request): string | undefined {
  return getCookieFromRequest(req, ACCESS_TOKEN_COOKIE);
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  return getCookieFromRequest(req, REFRESH_TOKEN_COOKIE);
}
