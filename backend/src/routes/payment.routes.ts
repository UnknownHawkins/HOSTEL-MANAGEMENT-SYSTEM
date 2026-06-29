import { Router } from 'express';
import { 
  createPaymentIntent, 
  completePayment, 
  getStudentPayments, 
  getAllPayments 
} from '../controllers/payment.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/create-intent', createPaymentIntent);
router.post('/complete', completePayment);
router.get('/my-payments', getStudentPayments);

// Admin and Warden view of payments
router.get('/all', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), getAllPayments);

export default router;
