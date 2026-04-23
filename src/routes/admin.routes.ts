import { Router } from 'express';
import { getPendingRequests, reviewRequest, getSignedFileUrl } from '../controllers/admin.controller';
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
router.get('/signed-url', getSignedFileUrl);

/**
 * @route POST /api/admin/requests/:requestId/review
 * @desc Approve or reject a request
 */
router.post('/requests/:requestId/review', reviewRequest);

export default router;
