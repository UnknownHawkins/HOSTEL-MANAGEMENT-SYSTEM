import { Router } from 'express';
import { 
  registerVisitor, 
  verifyVisitorEntry, 
  recordVisitorExit, 
  getVisitorLogs,
  getVisitorsWarden,
  checkInVisitorWarden,
  checkOutVisitorWarden
} from '../controllers/visitor.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Warden-specific check-ins
router.get('/', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getVisitorsWarden);
router.post('/check-in', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), checkInVisitorWarden);
router.patch('/check-out/:id', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), checkOutVisitorWarden);

// Pre-register can be done by students or warden
router.post('/register', registerVisitor);

// Verification and exits are restricted to Warden or Security staff (Warden/Admin/SuperAdmin)
router.post('/verify-entry', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), verifyVisitorEntry);
router.patch('/record-exit/:id', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), recordVisitorExit);
router.get('/logs', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getVisitorLogs);

export default router;
