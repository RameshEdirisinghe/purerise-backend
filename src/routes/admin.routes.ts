import { Router } from 'express';
import { getPendingRequests, reviewRequest, getSignedFileUrl, getAllUsers, updateUserStatus } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(requireRole('admin'));

/**
 * @route GET /api/admin/requests
 * @desc Get all pending campaign owner requests
 */
router.get('/requests', getPendingRequests);
router.post('/requests/:requestId/review', reviewRequest);
router.get('/signed-url', getSignedFileUrl);

/**
 * @route GET /api/admin/users
 * @desc Get all users for management
 */
router.get('/users', getAllUsers);

/**
 * @route PATCH /api/admin/users/:userId/status
 * @desc Block or unblock a user
 */
router.patch('/users/:userId/status', updateUserStatus);

export default router;
