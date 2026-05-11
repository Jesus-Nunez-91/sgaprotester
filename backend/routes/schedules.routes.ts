import { Router } from 'express';
import { getSchedules, upsertSchedule, bulkSchedules, deleteSchedule, deleteLabSchedules } from '../controllers/schedules.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getSchedules);
router.post('/', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), upsertSchedule);
router.post('/bulk', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), bulkSchedules);
router.delete('/:id', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), deleteSchedule);
router.delete('/lab/:lab', authMiddleware, deleteLabSchedules);

export default router;
