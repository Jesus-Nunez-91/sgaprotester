import { Router } from 'express';
import { getUsers, registerUser, createUser, bulkCreateUsers, updateUser, deleteUser } from '../controllers/users.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), getUsers);
router.post('/register', registerUser);
router.post('/', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), createUser);
router.post('/bulk', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), bulkCreateUsers);
router.put('/:id', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), updateUser);
router.delete('/:id', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), deleteUser);

export default router;
