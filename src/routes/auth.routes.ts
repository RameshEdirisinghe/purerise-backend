import { Router } from 'express';
import {
  register,
  registerAdmin,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  uploadProfileImage
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/multer.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.use(authMiddleware);
router.get('/me', getMe);
router.patch('/profile', updateProfile);
router.post('/profile-image', upload.single('file'), uploadProfileImage);

export default router;
