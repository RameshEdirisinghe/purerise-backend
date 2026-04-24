import { Router } from 'express';
import { 
  createCampaign,
  getMyCampaigns, 
  getCampaignsByOwnerId,
  uploadCampaignMediaController,
  getPendingCampaigns,
  reviewCampaign
} from '../controllers/campaign.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { upload } from '../middleware/multer.middleware';

const router = Router();

// All campaign routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/campaigns/create
 * @desc Create a new campaign with full details and milestones
 * @access projectOwner (authenticated)
 * @body { title, summary, description, category, coverImage, goalDescription, milestones }
 */
router.post(
  '/create',
  requireRole('projectOwner'),
  createCampaign
);

/**
 * @route POST /api/campaigns/media-upload
 * @desc Upload campaign media (images/videos)
 * @access projectOwner
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
 * @access projectOwner
 */
router.get('/my-campaigns', requireRole('projectOwner'), getMyCampaigns);

/**
 * @route GET /api/campaigns/owner/:ownerId
 * @desc Get campaigns by owner ID (Admin access)
 * @access admin
 */
router.get('/owner/:ownerId', requireRole('admin'), getCampaignsByOwnerId);

/**
 * @route GET /api/campaigns/pending
 * @desc Get all pending campaigns for review
 * @access admin
 */
router.get(
  '/pending',
  requireRole('admin'),
  getPendingCampaigns
);

/**
 * @route PATCH /api/campaigns/:campaignId/review
 * @desc Approve or reject a campaign
 * @access admin
 */
router.patch(
  '/:campaignId/review',
  requireRole('admin'),
  reviewCampaign
);

export default router;
