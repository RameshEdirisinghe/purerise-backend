import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not configured');
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not configured');
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES };
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not configured');
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not configured');
  return jwt.verify(token, secret) as TokenPayload;
};
