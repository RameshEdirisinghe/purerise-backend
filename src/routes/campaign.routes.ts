import { Router } from 'express';
import { getMyCampaigns, getCampaignsByOwnerId } from '../controllers/campaign.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All campaign routes require authentication
router.use(authMiddleware);

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
