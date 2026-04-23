import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiResponse';
import { UserRole } from '../models/user.model';

/**
 * Factory middleware — only passes if req.user.role is in the allowed list.
 * Must be used AFTER authMiddleware.
 *
 * @example router.get('/dashboard', authMiddleware, requireRole('contributor'), handler)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ApiError(
          403,
          `Access denied. Required role(s): ${allowedRoles.join(', ')}.`
        )
      );
      return;
    }

    next();
  };
};
