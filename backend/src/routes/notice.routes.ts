import { Router } from 'express';
import { getNotices, createNotice } from '../controllers/notice.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotices);
router.post('/create', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), createNotice);

export default router;
