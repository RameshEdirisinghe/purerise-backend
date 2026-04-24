import { Response } from 'express';
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from '../services/token.service';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Cookie security settings following industry standards:
 * - httpOnly: prevents XSS attacks by making cookies inaccessible to JavaScript
 * - secure: ensures cookies are only sent over HTTPS in production
 * - sameSite: lax in dev (allows cross-origin requests), strict in production
 * - path: scoped to API root for better security
 */
const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: IS_PRODUCTION, // HTTPS only in production
  sameSite: IS_PRODUCTION ? ('strict' as const) : ('lax' as const), // lax for dev, strict for prod
  path: '/',
};

export const setTokenCookies = (res: Response, payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Access token: 15 minutes (short-lived for security)
  res.cookie('accessToken', accessToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 15 * 60 * 1000,
  });

  // Refresh token: 7 days (longer-lived, used to get new access token)
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_DEFAULTS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

export const clearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: IS_PRODUCTION ? 'strict' : 'lax' });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true, sameSite: IS_PRODUCTION ? 'strict' : 'lax' });
};
