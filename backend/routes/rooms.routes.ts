import { Router } from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomBlocks, updateRoomBlock, getRoomReservations, updateRoomReservationStatus } from '../controllers/rooms.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getRooms);
router.post('/', authMiddleware, createRoom);
router.put('/:id', authMiddleware, updateRoom);
router.delete('/:id', authMiddleware, deleteRoom);

router.get('/:id/blocks', authMiddleware, getRoomBlocks);
router.put('/blocks/:id', authMiddleware, updateRoomBlock);

router.get('/reservations', authMiddleware, getRoomReservations);
router.put('/reservations/:id/status', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), updateRoomReservationStatus);

export default router;
