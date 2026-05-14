import express from 'express';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import { Server } from 'socket.io';
import cors from 'cors';
import logger from './utils/logger';
import path from 'path';
import { fileURLToPath } from 'url';
import "reflect-metadata";
import { AppDataSource } from './data-source';
export { AppDataSource };
import { Like, Not, In } from "typeorm";
import dotenv from "dotenv";
import helmet from "helmet";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import auditRoutes from './routes/audit.routes';
import settingsRoutes from './routes/settings.routes';
import { runSeed } from './seed';
import schedulesRoutes from './routes/schedules.routes';
import roomsRoutes from './routes/rooms.routes';
import reservationsRoutes from './routes/reservations.routes';
import { initSocket } from './socket';
import inventoryRoutes from './routes/inventory.routes';
import loansRoutes from './routes/loans.routes';
import procurementRoutes from './routes/procurement.routes';
import opsRoutes from './routes/ops.routes';
import commsRoutes from './routes/comms.routes';
import { handleSocketEvents } from './controllers/socket.controller';
// Entidades UAH
import { Ticket } from "../src/entities/Ticket";
import { Message } from "../src/entities/Message";
import { User } from "../src/entities/User";
import { Schedule } from "../src/entities/Schedule";
import { InventoryItem } from "../src/entities/InventoryItem";
import { Reservation } from "../src/entities/Reservation";
import { AdminTask } from "../src/entities/AdminTask";
import { MaintenanceTask } from "../src/entities/MaintenanceTask";
import { PurchaseOrder } from "../src/entities/PurchaseOrder";
import { AuditLog } from "../src/entities/AuditLog";
import { Project } from "../src/entities/Project";
import { ProjectTask } from "../src/entities/ProjectTask";
import { WikiDoc } from "../src/entities/WikiDoc";
import { Bitacora } from "../src/entities/Bitacora";
import { Room } from "../src/entities/Room";
import { RoomBlock } from "../src/entities/RoomBlock";
import { RoomReservation } from "../src/entities/RoomReservation";
import { ProcurementRequest } from "../src/entities/ProcurementRequest";
import { SystemSetting } from "../src/entities/SystemSetting";
import { Notification } from "../src/entities/Notification";
import { EquipmentLoan } from "../src/entities/EquipmentLoan";
import { SpecialLoan } from "../src/entities/SpecialLoan";
import { EquipmentInventory } from "../src/entities/EquipmentInventory";

dotenv.config();

const app = express();

// Redirección Global HTTP a HTTPS
app.use((req, res, next) => {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  const httpsUrl = `https://${req.hostname}${req.url}`;
  next(); 
});

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: 'Demasiados intentos de acceso. Por favor, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- CONFIGURACIÓN DE SEGURIDAD (HELMET) ---
// Helmet ayuda a proteger la aplicación configurando varias cabeceras HTTP.
app.use(helmet({ 
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Permitimos scripts del mismo servidor, inline (Angular) y CDNs autorizados
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/", "https://www.googletagmanager.com/", "https://cdn.jsdelivr.net/", "https://cdn.sheetjs.com/"],
      // Estilos desde el servidor y fuentes de Google/CDNs
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/", "https://cdn.jsdelivr.net/"],
      imgSrc: ["'self'", "data:", "https://www.google-analytics.com/"],
      // Conexiones de datos (API, Google Analytics, Source Maps)
      connectSrc: ["'self'", "https://www.google-analytics.com/", "https://cdn.jsdelivr.net/"],
      fontSrc: ["'self'", "https://fonts.gstatic.com/", "https://cdn.jsdelivr.net/"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
      frameAncestors: ["'self'"], // Previene Clickjacking (solo se puede embeber en sí mismo)
    },
  },
  crossOriginOpenerPolicy: false,
  xFrameOptions: { action: "sameorigin" },
}));

// --- POLÍTICA DE CORS (CROSS-ORIGIN RESOURCE SHARING) ---
// Define quién puede hacer peticiones a nuestra API con credenciales (cookies)
const allowedOrigins = [
  'http://localhost:4200', 
  'http://localhost:3000', 
  'https://localhost:3040', 
  'https://10.10.0.20:3040', 
  'http://10.10.0.20:3040',
  'https://sga.uah.cl'
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Si el origen está en la lista blanca o es una petición local (sin origen), permitimos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Bloqueo y registro de intento de acceso no autorizado
      logger.error(`CORS Bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS (Política de Seguridad)'));
    }
  }, 
  credentials: true 
}));

// Cabeceras de Cache y Seguridad Adicionales
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET no está configurado en .env");
  process.exit(1);
}

// Inicializar DB y Lanzar Servidor
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Conexión a Base de Datos establecida con éxito.");
    await runSeed();
    startServer();
  })
  .catch((err) => {
    console.error("❌ Error FATAL inicializando base de datos:", err);
    process.exit(1);
  });

// Rutas API Desacopladas (MVC)
app.use('/api/auth', authRoutes);
app.use('/api/config', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/inventory', inventoryRoutes);

// Rutas agrupadas que manejan sus propios sub-path
app.use('/api', reservationsRoutes);
app.use('/api', loansRoutes);
app.use('/api', procurementRoutes);
app.use('/api', opsRoutes);
app.use('/api', commsRoutes);

// --- SERVIR FRONTEND ---
const publicPath = path.join(process.cwd(), 'dist/sga-fin/browser');
app.use(express.static(publicPath));

// Fallback para SPA (Cualquier ruta no manejada por API va al index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// --- MIDDLEWARE GLOBAL DE LOGS DE ERROR (SEGURO) ---
app.use((err: any, req: any, res: any, next: any) => {
  logger.error(`[ERROR 500] ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
    body: req.body,
    query: req.query,
    user: req.user?.id
  });

  res.status(500).json({ 
    message: 'Ha ocurrido un error interno en el servidor.',
    path: req.url,
    timestamp: new Date().toISOString()
  });
});

function startServer() {
  let httpServerInstance;
  const sslPath = path.join(__dirname, 'ssl');
  const hasCert = fs.existsSync(path.join(sslPath, 'cert.pem')) && fs.existsSync(path.join(sslPath, 'key.pem'));

  if (hasCert) {
    const options = {
      key: fs.readFileSync(path.join(sslPath, 'key.pem')),
      cert: fs.readFileSync(path.join(sslPath, 'cert.pem')),
    };
    httpServerInstance = createHttpsServer(options, app);
    console.log(`🛡️  Servidor HTTPS habilitado.`);
  } else {
    httpServerInstance = createHttpServer(app);
    console.log(`⚠️  Servidor corriendo en HTTP (Certificados no encontrados en backend/ssl/)`);
  }

  const io = initSocket(httpServerInstance);

  httpServerInstance.listen(PORT, () => {
    console.log(`🚀 Servidor listo y ESCUCHANDO en puerto ${PORT} (${hasCert ? 'HTTPS' : 'HTTP'})`);
    console.log(`📡 URL Base: ${hasCert ? 'https' : 'http'}://10.10.0.20:${PORT}`);
    console.log(`🛡️  Logs de errores seguros (Winston) ACTIVADOS`);
  });
}
