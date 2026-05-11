import { Router } from 'express';
import { getWiki, saveWiki, deleteWiki, getBitacora, createBitacoraEntry, updateBitacoraEntry, deleteBitacoraEntry, getNotifications, createNotificationApi, markNotificationRead, markAllNotificationsRead, deleteAllNotifications } from '../controllers/comms.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/wiki', authMiddleware, getWiki);
router.post('/wiki', authMiddleware, saveWiki);
router.put('/wiki/:id', authMiddleware, saveWiki);
router.delete('/wiki/:id', authMiddleware, deleteWiki);

router.get('/bitacora', authMiddleware, getBitacora);
router.post('/bitacora', authMiddleware, createBitacoraEntry);
router.put('/bitacora/:id', authMiddleware, updateBitacoraEntry);
router.delete('/bitacora/:id', authMiddleware, deleteBitacoraEntry);

router.get('/notifications', authMiddleware, getNotifications);
router.post('/notifications', authMiddleware, createNotificationApi);
router.patch('/notifications/:id/read', authMiddleware, markNotificationRead);
router.post('/notifications/mark-all-read', authMiddleware, markAllNotificationsRead);
router.delete('/notifications/all', authMiddleware, deleteAllNotifications);

export default router;
