import { Router } from 'express';
import { 
  getRooms, 
  allocateRoomManual, 
  allocateRoomAuto, 
  deallocateRoom,
  allocateRoomWarden
} from '../controllers/room.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRooms);

// Only Wardens and Admins can allocate/deallocate rooms
router.post('/allocate', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), allocateRoomWarden);
router.post('/allocate-manual', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), allocateRoomManual);
router.post('/allocate-auto', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), allocateRoomAuto);
router.delete('/deallocate/:studentId', requireRole(['WARDEN', 'ADMIN', 'SUPER_ADMIN']), deallocateRoom);

export default router;
