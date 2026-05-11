import { Router } from 'express';
import { getRecaptchaSiteKey, getSettings, upsertSetting, deleteSetting } from '../controllers/settings.controller';
import { authMiddleware, checkPermission, ROLES } from '../middleware/auth.middleware';

const router = Router();

router.get('/recaptcha-site-key', getRecaptchaSiteKey);
router.get('/', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), getSettings);
router.post('/', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), upsertSetting);
router.delete('/:key', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), deleteSetting);

export default router;
