import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos de acceso. Por favor, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authRateLimit, login);

export default router;
