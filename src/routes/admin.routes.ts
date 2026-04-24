import { Router } from 'express';
import { getPendingRequests, reviewRequest, getSignedFileUrl, getAllUsers, updateUserStatus } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(requireRole('admin'));


router.get('/requests', getPendingRequests);
router.post('/requests/:requestId/review', reviewRequest);
router.get('/signed-url', getSignedFileUrl);

router.get('/users', getAllUsers);
 */
router.patch('/users/:userId/status', updateUserStatus);

export default router;
