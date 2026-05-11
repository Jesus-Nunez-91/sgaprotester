import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getAuditLogs);

export default router;
