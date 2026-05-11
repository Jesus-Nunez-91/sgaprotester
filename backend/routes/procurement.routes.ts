import { Router } from 'express';
import { getProcurement, createProcurement, getProcurementRequests, deleteProcurementRequest, clearGhostRequests } from '../controllers/procurement.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/procurement', authMiddleware, getProcurement);
router.post('/procurement', authMiddleware, createProcurement);

router.get('/procurement-requests', authMiddleware, getProcurementRequests);
router.delete('/procurement-requests/:id', authMiddleware, deleteProcurementRequest);
router.delete('/procurement-requests/mass/clear-ghosts', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), clearGhostRequests);

export default router;
