import { Router } from 'express';
import { getReservations, createReservation, updateReservation, deleteReservation, checkInReservation, checkOutReservation, createRoomReservation, deleteRoomReservation } from '../controllers/reservations.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/reservations', authMiddleware, getReservations);
router.post('/reservations', authMiddleware, createReservation);
router.put('/reservations/:id', authMiddleware, updateReservation);
router.delete('/reservations/:id', authMiddleware, deleteReservation);

router.post('/reservations/:id/check-in', authMiddleware, checkInReservation);
router.post('/reservations/:id/check-out', authMiddleware, checkOutReservation);

// Reservas de sala (compatibilidad con endpoints antiguos)
router.post('/room-reservations', authMiddleware, checkPermission(ROLES.RESERVATION_USERS), createRoomReservation);
router.delete('/room-reservations/:id', authMiddleware, deleteRoomReservation);

export default router;
