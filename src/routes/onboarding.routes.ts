import { Router } from 'express';
import { submitCampaignOwnerOnboarding, getOnboardingStatus } from '../controllers/onboarding.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All onboarding routes require authentication
router.use(authMiddleware);

router.post('/campaign-owner', submitCampaignOwnerOnboarding);
router.get('/status', getOnboardingStatus);

export default router;
