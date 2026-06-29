import { Router } from 'express';
import { 
  register, 
  login, 
  setupStudentProfile, 
  refreshToken, 
  logout, 
  getMe,
  changePassword
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.get('/me', authenticate, getMe);
router.post('/setup-profile', authenticate, setupStudentProfile);
router.post('/change-password', authenticate, changePassword);

export default router;
