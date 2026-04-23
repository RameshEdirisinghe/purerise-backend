import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();

// All routes here are gated: must be authenticated + contributor role
router.use(authMiddleware, requireRole('contributor'));

// GET /contributor/dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  res.status(200).json(
    new ApiResponse(200, 'Welcome to your contributor dashboard', {
      message: `Hello, contributor ${req.user?.userId}!`,
      features: [
        'Browse active campaigns',
        'Track your backed projects',
        'Manage pledges',
        'Receive project updates',
      ],
    })
  );
});

export default router;
