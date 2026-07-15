import { Router } from 'express';
import { 
  createCampaign,
  getMyCampaigns, 
  getCampaignsByOwnerId,
  uploadCampaignMediaController,
  getPendingCampaigns,
  reviewCampaign,
  getActiveCampaigns,
  getCampaignById,
  recordContribution,
  getMyContributions,
  recordWithdrawal,
} from '../controllers/campaign.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { upload } from '../middleware/multer.middleware';

const router = Router();

/**
 * @route GET /api/campaigns/active
 * @desc Get all live campaigns for discovery
 * @access Public (no auth required)
 */
router.get('/active', getActiveCampaigns);



// All routes below require authentication
router.use(authMiddleware);

/**
 * @route POST /api/campaigns/create
 * @desc Create a new campaign with full details and milestones
 * @access projectOwner (authenticated)
 */
router.post('/create', requireRole('projectOwner'), createCampaign);

/**
 * @route POST /api/campaigns/media-upload
 * @desc Upload campaign media (images/videos)
 * @access projectOwner
 */
router.post('/media-upload', requireRole('projectOwner'), upload.single('file'), uploadCampaignMediaController);

/**
 * @route GET /api/campaigns/my-campaigns
 * @desc Get campaigns for the authenticated owner
 * @access projectOwner
 */
router.get('/my-campaigns', requireRole('projectOwner'), getMyCampaigns);

/**
 * @route GET /api/campaigns/my-contributions
 * @desc Get all contributions made by the authenticated contributor
 * @access contributor
 * NOTE: Must be before /:campaignId wildcard to avoid route shadowing
 */
router.get('/my-contributions', requireRole('contributor'), getMyContributions);

/**
 * @route GET /api/campaigns/owner/:ownerId
 * @desc Get campaigns by owner ID (Admin access)
 * @access admin
 * NOTE: Must be before /:campaignId wildcard to avoid route shadowing
 */
router.get('/owner/:ownerId', requireRole('admin'), getCampaignsByOwnerId);

/**
 * @route GET /api/campaigns/pending
 * @desc Get all pending campaigns for review
 * @access admin
 * NOTE: Must be before /:campaignId wildcard to avoid route shadowing
 */
router.get('/pending', requireRole('admin'), getPendingCampaigns);

/**
 * @route GET /api/campaigns/:campaignId
 * @desc Get a single campaign by ID
 * @access Public (no auth required)
 * NOTE: Wildcard — must be after all specific /campaigns/* routes
 */
router.get('/:campaignId', getCampaignById);

/**
 * @route PATCH /api/campaigns/:campaignId/review
 * @desc Approve or reject a campaign
 * @access admin
 */
router.patch('/:campaignId/review', requireRole('admin'), reviewCampaign);

/**
 * @route POST /api/campaigns/:campaignId/contribution
 * @desc Record a contributor's on-chain contribution for identity association
 * @access contributor
 * @body { walletAddress, amountEth, txHash }
 */
router.post('/:campaignId/contribution', requireRole('contributor'), recordContribution);

/**
 * @route POST /api/campaigns/:campaignId/withdrawal
 * @desc Record an on-chain withdrawal in MongoDB for dashboard history
 * @access projectOwner
 * @body { amountEth, txHash, blockNumber }
 */
router.post('/:campaignId/withdrawal', requireRole('projectOwner'), recordWithdrawal);

export default router;
