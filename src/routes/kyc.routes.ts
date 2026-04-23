import { Router } from 'express';
import { upload } from '../middleware/multer.middleware';
import { uploadKYCDocument } from '../controllers/kyc.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All KYC routes require authentication
router.use(authMiddleware);

// Route: /api/kyc/kyc-upload
router.post('/kyc-upload', upload.single('file'), uploadKYCDocument);

export default router;
