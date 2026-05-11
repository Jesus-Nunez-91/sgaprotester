import { Router } from 'express';
import { getInventory, createInventoryItem, bulkInventory, updateInventoryItem, deleteInventoryItem, clearInventory } from '../controllers/inventory.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getInventory);
router.post('/', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), createInventoryItem);
router.post('/bulk', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), bulkInventory);
router.put('/:id', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), updateInventoryItem);
router.delete('/:id', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), deleteInventoryItem);
router.delete('/mass/clear', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), clearInventory);

export default router;
