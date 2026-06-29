import { Router } from 'express';
import { 
  getDashboardStats, 
  createWarden, 
  getAuditLogs, 
  getSystemHealth, 
  backupDatabase, 
  restoreDatabase,
  getStudents,
  getWardens,
  getAdmins
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Accessible by WARDEN, ADMIN, and SUPER_ADMIN
router.get('/students', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getStudents);

// Restricted to ADMIN and SUPER_ADMIN
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/stats', getDashboardStats);
router.post('/wardens', createWarden);
router.get('/wardens', getWardens);
router.get('/audit-logs', getAuditLogs);

// Super admin specific features
router.get('/admins', requireRole(['SUPER_ADMIN']), getAdmins);
router.get('/system-health', requireRole(['SUPER_ADMIN']), getSystemHealth);
router.post('/backup', requireRole(['SUPER_ADMIN']), backupDatabase);
router.post('/restore', requireRole(['SUPER_ADMIN']), restoreDatabase);

export default router;
