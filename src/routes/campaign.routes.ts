import { Router } from 'express';
import { 
  getMyCampaigns, 
  getCampaignsByOwnerId,
  uploadCampaignMediaController 
} from '../controllers/campaign.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { upload } from '../middleware/multer.middleware';

const router = Router();

// All campaign routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/campaigns/media-upload
 * @desc Upload campaign media (images/videos)
 */
router.post(
  '/media-upload', 
  requireRole('projectOwner'), 
  upload.single('file'), 
  uploadCampaignMediaController
);

/**
 * @route GET /api/campaigns/my-campaigns
 * @desc Get campaigns for the authenticated owner
 */
router.get('/my-campaigns', requireRole('projectOwner'), getMyCampaigns);

/**
 * @route GET /api/campaigns/owner/:ownerId
 * @desc Get campaigns by owner ID (Admin access)
 */
router.get('/owner/:ownerId', requireRole('admin'), getCampaignsByOwnerId);

export default router;
