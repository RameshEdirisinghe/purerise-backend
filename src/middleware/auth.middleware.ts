import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../models/user.model';

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token: string | undefined = req.cookies['accessToken'];
    console.log('Token:', token);

    if (!token) {
      throw new ApiError(401, 'Access token missing. Please log in.');
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    // JWT errors (expired, malformed, etc.)
    next(new ApiError(401, 'Invalid or expired access token. Please log in again.'));
  }
};
