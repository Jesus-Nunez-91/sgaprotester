import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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
const httpServer = createServer(app);

// Rate limiting for auth routes
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: 'Demasiados intentos de acceso. Por favor, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false // Desactivado para red interna (Staging)
}));
app.use(cors({ origin: true, credentials: true })); // Habilitar CORS con credenciales para cookies HttpOnly
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const io = initSocket(httpServer);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET no está configurado en .env");
  process.exit(1);
}

// Función para normalizar texto (quitar tildes y caracteres especiales)
// normalizeStr movido a utils/helpers.ts

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

// logAudit movido a utils/logger.ts

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


// --- INICIALIZAR SERVIDOR ---
// --- MIDDLEWARE GLOBAL DE LOGS DE ERROR (PEDIDO POR USUARIO) ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error(`[FATAL ERROR] ${req.method} ${req.url}:`, err.stack || err.message);
  res.status(500).json({ 
    message: 'Error interno del servidor capturado por el log global',
    error: err.message,
    path: req.url
  });
});

function startServer() {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor listo y ESCUCHANDO en puerto ${PORT}`);
    console.log(`📡 URL Base: http://localhost:${PORT}`);
    console.log(`🛡️  Logs de errores globales ACTIVADOS`);
  });
}
