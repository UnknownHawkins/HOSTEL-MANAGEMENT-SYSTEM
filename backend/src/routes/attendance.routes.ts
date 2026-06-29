import { Router } from 'express';
import { 
  markAttendance, 
  getStudentAttendance, 
  getHostelAttendance 
} from '../controllers/attendance.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/my-attendance', getStudentAttendance);

// Restrict marking and loading all attendance list to Warden/Admin
router.post('/mark', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), markAttendance);
router.get('/all', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getHostelAttendance);

export default router;
