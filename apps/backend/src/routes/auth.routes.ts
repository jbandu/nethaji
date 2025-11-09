import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  refreshTokenHandler,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/refresh', authenticate, refreshTokenHandler);

export default router;
