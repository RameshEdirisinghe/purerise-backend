import { Response } from 'express';
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from '../services/token.service';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: 'strict' as const,
  path: '/',
};

export const setTokenCookies = (res: Response, payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Access token: 15 minutes
  res.cookie('accessToken', accessToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token: 7 days
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

export const clearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};
