import { Router } from 'express';
import { 
  applyLeave, 
  getStudentLeaves, 
  getAllLeaves, 
  reviewLeave 
} from '../controllers/leave.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/apply', applyLeave);
router.get('/my-leaves', getStudentLeaves);

// Warden and Admin can view all leaves and approve/reject them
router.get('/all', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getAllLeaves);
router.patch('/review/:id', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), reviewLeave);

export default router;
