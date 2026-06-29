import { Router } from 'express';
import { askAiAssistant, getStudentRiskAnalysis } from '../controllers/ai.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// All authenticated users can talk to AI assistant
router.post('/chat', askAiAssistant);

// Only wardens/admins can query student risk summaries
router.post('/risk-analysis', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getStudentRiskAnalysis);

export default router;
