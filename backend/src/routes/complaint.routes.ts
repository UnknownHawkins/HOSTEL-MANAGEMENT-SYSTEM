import { Router } from 'express';
import { 
  createComplaint, 
  getStudentComplaints, 
  getAllComplaints, 
  updateComplaint 
} from '../controllers/complaint.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/create', createComplaint);
router.get('/my-complaints', getStudentComplaints);

// Warden and Admin can view all tickets and assign/resolve them
router.get('/all', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getAllComplaints);
router.patch('/update/:id', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), updateComplaint);

export default router;
