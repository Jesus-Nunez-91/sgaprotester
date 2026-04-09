import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import "reflect-metadata";
import { AppDataSource } from './data-source';
import { Like, Not, In } from "typeorm";
import dotenv from "dotenv";
import helmet from "helmet";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

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
app.use(cors({ origin: "*" })); // Habilitar CORS para aplicaciones móviles y web
app.use(express.json({ limit: '20mb' }));

const io = new Server(httpServer, {
  cors: {
    origin: "*" // Permitir handshake desde cualquier origen (móvil/web)
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'uah_secret_fallback';

// Función para normalizar texto (quitar tildes y caracteres especiales)
const normalizeStr = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

// Inicializar DB y Lanzar Servidor
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Conexión a Base de Datos establecida con éxito.");
    
    // Semilla Administrador (SuperUser)
    try {
      const userRepo = AppDataSource.getRepository(User);
      const adminExists = await userRepo.findOneBy({ correo: 'admin@uah.cl' });
      if (!adminExists) {
          console.log("🌱 Creando administrador root...");
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await userRepo.save(userRepo.create({
              nombreCompleto: 'Administrador Sistema',
              rut: '1-9',
              correo: 'admin@uah.cl',
              password: hashedPassword,
              rol: 'SuperUser'
          }));
      }
    } catch(e) { console.warn("⚠️ Error al verificar semilla Admin:", e); }

    startServer();
  })
  .catch((err) => {
    console.error("❌ Error FATAL inicializando base de datos:", err);
    process.exit(1);
  });

const logAudit = async (nombre: string, usuario: string, rol: string, accion: string, detalle: string) => {
  try {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const log = auditRepo.create({ nombre, usuario, rol, accion, detalle });
    await auditRepo.save(log);
  } catch (error) {
    console.error("Error saving audit log:", error);
  }
};

// --- ENDPOINTS DE CONFIGURACION PUBLICA ---
app.get('/api/config/recaptcha-site-key', (req, res) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY || '' });
});

// --- ENDPOINTS DE AUTENTICACION ---

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    const { correo, password, recaptchaToken } = req.body;

    // Validación OWASP reCAPTCHA (si la llave secreta está configurada)
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (secretKey) {
        if (!recaptchaToken) {
            return res.status(401).json({ message: 'Validación de seguridad requerida (CAPTCHA)' });
        }
        /* 
        // [TEMPORAL] Comentado para pruebas en servidor 10.10.0.20
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
        const response = await fetch(verificationUrl, { method: 'POST' });
        const verification: any = await response.json();
        
        if (!verification.success) {
          return res.status(401).json({ message: 'Falló verificación de reCAPTCHA' });
        }
        */
        console.log("[AUTH] reCAPTCHA puenteado para entorno de pruebas.");
        
        /*
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
        const recaptchaData = await recaptchaRes.json();
        
        if (!recaptchaData.success) {
            await logAudit('Sistema', correo || 'N/A', 'N/A', 'LOGIN_FAIL', 'Intento bloqueado: reCAPTCHA fallido o expirado');
            return res.status(401).json({ message: 'Comprobación anti-robot fallida' });
        }
        */
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ correo });

    if (!user) {
      await logAudit('Sistema', correo || 'N/A', 'N/A', 'LOGIN_FAIL', 'Intento de login fallido: Correo no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAudit(user.nombreCompleto, user.correo, user.rol, 'LOGIN_FAIL', 'Intento de login fallido: Password incorrecta');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombreCompleto, correo: user.correo },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAudit(user.nombreCompleto, user.correo, user.rol, 'LOGIN_SUCCESS', 'Inicio de sesión exitoso');

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// --- API DE CONFIGURACIONES SISTEMICAS (UAH) ---

app.get('/api/settings', async (req, res) => {
  try {
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    const settings = await settingRepo.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuraciones' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    
    let setting = await settingRepo.findOneBy({ key });
    if (setting) {
      setting.value = value;
      setting.description = description || setting.description;
    } else {
      setting = settingRepo.create({ key, value, description });
    }
    
    await settingRepo.save(setting);
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar configuración' });
  }
});

app.delete('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    await settingRepo.delete({ key });
    res.json({ message: 'Configuración eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar configuración' });
  }
});

app.post('/api/auth/register', authRateLimit, async (req, res) => {
  try {
    const { nombreCompleto, email, rut, carrera, anio, rol, pass } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    
    // Verificar si ya existe
    const existing = await userRepo.findOneBy({ correo: email });
    if (existing) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = userRepo.create({
      nombreCompleto,
      correo: email,
      rut,
      carrera,
      anioIngreso: Number(anio),
      rol: rol || 'Alumno',
      password: hashedPassword
    });

    await userRepo.save(user);
    await logAudit(nombreCompleto, email, rol, 'REGISTER', 'Usuario registrado exitosamente');
    
    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Middleware para proteger rutas
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// --- NÚCLEO DE PERMISOS (RBAC) ---
const ROLES = {
  ADMIN_STUFF: ['SuperUser', 'Admin_Labs', 'Admin_Acade'],
  RESERVATION_USERS: ['SuperUser', 'Admin_Labs', 'Admin_Acade', 'Academico', 'Docente', 'Alumno'],
  ACADEMIC_EDIT: ['SuperUser', 'Admin_Labs', 'Admin_Acade'],
  SECURITY_ONLY: ['SuperUser']
};

const checkPermission = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: `Acceso denegado: El rol ${req.user?.rol || 'N/A'} no tiene permisos para esta acción.` 
      });
    }
    next();
  };
};

// Endpoints de Usuario (Protegidos)
app.get('/api/users', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), async (req: any, res) => {
  try {
    const users = await AppDataSource.getRepository(User).find();
    res.json(users.map(u => {
      const { password, ...rest } = u as any;
      return rest;
    }));
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

app.get('/api/audit', authMiddleware, async (req: any, res) => {
  // Solo SuperUser puede ver la "Caja Negra" (AuditLog)
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser tiene acceso a la Caja Negra' });
  }
  const logs = await AppDataSource.getRepository(AuditLog).find({ order: { fecha: 'DESC' }, take: 1000 });
  res.json(logs);
});

app.post('/api/users', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser gestiona usuarios' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    const { password, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'uah123', 10);
    const newUser = userRepo.create({ ...userData, password: hashedPassword });
    const savedUser: any = await userRepo.save(newUser);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CREATE_USER', `Usuario creado: ${savedUser.nombreCompleto} (${savedUser.rol})`);

    const { password: _, ...result } = savedUser;
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear usuario' });
  }
});

app.post('/api/users/bulk', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser gestiona usuarios' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    const usersData = req.body;

    if (!Array.isArray(usersData)) {
      return res.status(400).json({ message: 'Datos deben ser un array' });
    }

    const defaultPassword = await bcrypt.hash('uah123', 10);
    const created = [];
    const skipped = [];

    for (const u of usersData) {
      // Verificar si ya existe por correo o RUT antes de intentar guardar
      const exists = await userRepo.findOne({
        where: [{ correo: u.correo }, { rut: u.rut }]
      });

      if (exists) {
        skipped.push(u.correo || u.rut);
        continue;
      }

      const newUser = userRepo.create({
        ...u,
        password: defaultPassword
      });
      await userRepo.save(newUser);
      created.push(newUser);
    }

    res.status(201).json({
      message: `${created.length} usuarios creados exitosamente.`,
      skippedCount: skipped.length,
      skipped: skipped
    });
  } catch (error) {
    console.error("Error bulk users:", error);
    res.status(500).json({ message: 'Error interno al procesar carga masiva' });
  }
});

app.put('/api/users/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser gestiona usuarios' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { password, ...updateData } = req.body;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    Object.assign(user, updateData);
    const updatedUser: any = await userRepo.save(user);
    const { password: _, ...result } = updatedUser;
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar usuario' });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser gestiona usuarios' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
  }
});

// --- ENDPOINTS DE HORARIOS ---

// --- HORARIOS (ACADÉMICOS) ---
app.get('/api/schedules', authMiddleware, async (req, res) => {
    try {
        const schedules = await AppDataSource.getRepository(Schedule).find();
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ message: 'Error al cargar horarios' });
    }
});

app.post('/api/schedules', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), async (req: any, res) => {
  try {
    const { lab, day, block, subject, color } = req.body;
    const scheduleRepo = AppDataSource.getRepository(Schedule);
    const roomRepo = AppDataSource.getRepository(Room);

    // Normalizar nombres para consistencia
    const canonicalLab = lab.toUpperCase();
    const normalizedLab = normalizeStr(lab);
    
    // [SINCRONIZACIÓN] Buscar sala ignorando tildes
    const allRooms = await roomRepo.find();
    let room = allRooms.find((r: any) => normalizeStr(r.nombre) === normalizedLab);

    if (!room) {
      console.log(`[SYNC] Creando nueva sala desde Horarios: ${lab}`);
      room = roomRepo.create({
        nombre: canonicalLab,
        tipo: lab.toUpperCase().includes('SALA') ? 'Sala de Reuniones' : 'Laboratorio',
        capacidadMaxima: 20,
        ubicacionPiso: 'Por definir'
      });
      const savedRoom: any = await roomRepo.save(room);
      
      const blocks = [
          { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
          { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
          { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
          { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
          { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
          { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
          { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
      ];
      const blockRepo = AppDataSource.getRepository(RoomBlock);
      for (const b of blocks) {
          await blockRepo.save(blockRepo.create({
              roomId: savedRoom.id,
              nombreBloque: b.nombre,
              horaInicio: b.inicio,
              horaFin: b.fin
          }));
      }
    }

    let schedule = await scheduleRepo.findOneBy({ lab: room.nombre, day, block });

    if (schedule) {
      schedule.subject = subject;
      schedule.color = color;
    } else {
      schedule = scheduleRepo.create({ lab: room.nombre, day, block, subject, color });
    }

    await scheduleRepo.save(schedule);
    res.json(schedule);
  } catch (error) {
    console.error("Error al actualizar horario:", error);
    res.status(500).json({ message: 'Error al actualizar horario' });
  }
});

app.post('/api/schedules/bulk', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), async (req: any, res) => {
  try {
    const schedulesData = req.body;
    if (!Array.isArray(schedulesData)) {
      return res.status(400).json({ message: 'Datos deben ser un array' });
    }

    const scheduleRepo = AppDataSource.getRepository(Schedule);
    const roomRepo = AppDataSource.getRepository(Room);
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    
    const results = [];
    for (const s of schedulesData) {
      const { lab, day, block, subject, color } = s;

      // [SINCRONIZACIÓN] Verificar Room (Normalizando tildes para evitar duplicados)
      const allRooms = await roomRepo.find();
      let room = allRooms.find(r => normalizeStr(r.nombre) === normalizeStr(lab));
        
      if (!room && lab !== 'HIDDEN') {
        room = await roomRepo.save(roomRepo.create({
          nombre: lab.toUpperCase(), // Normalizar a Mayúsculas para consistencia UAH
          tipo: 'Laboratorio',
          capacidadMaxima: 20,
          ubicacionPiso: 'Carga masiva'
        })) as any;
        const defaultBlocks = [
          { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
          { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
          { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
          { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
          { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
          { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
          { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
        ];
        for (const b of defaultBlocks) {
          await blockRepo.save(blockRepo.create({
            roomId: room!.id,
            nombreBloque: b.nombre,
            horaInicio: b.inicio,
            horaFin: b.fin
          }));
        }
      }

      const canonicalLab = lab.toUpperCase();
      let schedule = await scheduleRepo.findOneBy({ lab: canonicalLab, day, block });
      if (schedule) {
        schedule.subject = subject;
        schedule.color = color;
      } else {
        schedule = scheduleRepo.create({ lab: canonicalLab, day, block, subject, color });
      }
      results.push(await scheduleRepo.save(schedule));
    }

    res.status(201).json({ message: `${results.length} bloques procesados`, count: results.length });
  } catch (error) {
    console.error("Error en carga masiva de horarios:", error);
    res.status(500).json({ message: 'Error interno en carga masiva' });
  }
});

app.delete('/api/schedules/:id', authMiddleware, checkPermission(ROLES.ACADEMIC_EDIT), async (req: any, res) => {
  try {
    await AppDataSource.getRepository(Schedule).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar horario' });
  }
});

// --- ENDPOINTS DE INVENTARIO ---

app.get('/api/inventory', authMiddleware, async (req, res) => {
  const items = await AppDataSource.getRepository(InventoryItem).find();
  res.json(items);
});

app.post('/api/inventory', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const { marca, modelo, rotulo_ID, sn } = req.body;

    // Verificar duplicado por SN o Rótulo (si existen)
    if (sn || rotulo_ID) {
      const existing = await itemRepo.findOne({
        where: [
          ...(sn ? [{ sn }] : []),
          ...(rotulo_ID ? [{ rotulo_ID }] : [])
        ]
      });
      if (existing) {
        return res.status(400).json({ message: `Ya existe un ítem con el SN: ${sn} o Rótulo: ${rotulo_ID}` });
      }
    }

    // Si no tiene SN/Rótulo, verificamos por nombre+modelo exacto
    const duplicate = await itemRepo.findOneBy({ marca, modelo });
    if (duplicate && !sn && !rotulo_ID) {
      return res.status(400).json({ message: `Atención: Ya existe un item '${marca} ${modelo}'. Use Carga Masiva para sumar stock o añada un Identificador único.` });
    }

    const newItem = itemRepo.create(req.body);
    const savedItem = await itemRepo.save(newItem) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_CREATE', `Item creado: ${savedItem.marca} ${savedItem.modelo} (${savedItem.rotulo_ID || 'Sin rotulo'})`);
    
    // [NOTIFICACIÓN] Avisar de nuevo ingreso en inventario
    await createNotification('all', 'Nuevo Ítem de Inventario', `${req.user.nombre} añadió ${savedItem.marca} ${savedItem.modelo}`, 'info');
    
    res.status(201).json(savedItem);
  } catch (error: any) {
    console.error("ERROR AL CREAR ITEM INDIVIDUAL:", error.message);
    if (error.detail) console.error("DETALLE DB:", error.detail);
    res.status(400).json({ message: 'Error al crear item', error: error.message });
  }
});

app.post('/api/inventory/bulk', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const itemsData = req.body;

    if (!Array.isArray(itemsData)) {
      return res.status(400).json({ message: 'Datos deben ser un array' });
    }

    console.log(`PROCESANDO CARGA MASIVA: ${itemsData.length} items.`);
    
    const created = [];
    const errors = [];

    for (const data of itemsData) {
      try {
        if (!data.tipoInventario) data.tipoInventario = 'Materiales';
        if (!data.status) data.status = 'Disponible';
        
        // IDENTIDAD DE ARTÍCULO (Jerarquía UAH)
        const snClean = data.sn?.trim();
        const rotuloClean = data.rotulo_ID?.trim();
        const snPlaceholders = ['MUEBLEMET.', 'MUEBLEMET', 'NA', 'N/A', 'SIN', 'S/N', '0', 'FABLAB', '-', '.', 'SIN SERIAL'];

        let exists = null;

        // 1. Prioridad Absoluta: Rótulo / ID Físico
        if (rotuloClean && rotuloClean !== '') {
            exists = await itemRepo.findOne({ where: { rotulo_ID: rotuloClean } });
            if (exists) console.log(`[BULK] Match por Rótulo: ${rotuloClean}`);
        } 
        
        // 2. Prioridad Secundaria: S/N (Solo si no hubo match por Rótulo y el S/N es real)
        if (!exists && snClean && snClean !== '' && !snPlaceholders.includes(snClean.toUpperCase())) {
            exists = await itemRepo.findOne({ where: { sn: snClean } });
            if (exists) console.log(`[BULK] Match por S/N: ${snClean}`);
        }

        if (exists) {
            // Unificar stock
            exists.stockActual = (exists.stockActual || 0) + (data.stockActual || 1);
            const saved = await itemRepo.save(exists);
            await logRequest(req, 'MATERIAL', `Actualización Stock: ${saved.marca} ${saved.modelo} (Rot: ${saved.rotulo_ID})`, saved.id, 'N/A', 'Aprobado');
            created.push(saved);
            continue;
        }

        const newItem = itemRepo.create(data);
        const saved: any = await itemRepo.save(newItem);
        
        // Trazabilidad Unificada (UAH Auditoría - Auto-aprobada por ser carga masiva)
        await logRequest(req, 'MATERIAL', `Carga masiva: ${saved.marca} ${saved.modelo} (Rot: ${saved.rotulo_ID})`, saved.id, 'N/A', 'Aprobado');
        
        created.push(saved);
      } catch (err: any) {
        console.error("FALLO ITEM INDIVIDUAL:", data.marca, data.modelo);
        console.error("ERROR:", err.message);
        errors.push({ item: `${data.marca} ${data.modelo}`, error: err.message });
      }
    }

    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_BULK', `Carga masiva: ${created.length} creados, ${errors.length} fallidos`);
    
    // [NOTIFICACIÓN CONSOLIDADA] Una sola alerta por toda la carga masiva
    if (created.length > 0) {
      await createNotification('all', 'Carga Masiva Inventario', `Se procesaron ${created.length} ítems exitosamente por ${req.user.nombre}`, 'success');
    }

    res.status(201).json({
      message: 'Procesamiento masivo completado',
      count: created.length,
      errorCount: errors.length,
      errors: errors.slice(0, 10) // Enviar solo los primeros 10 errores al cliente
    });
  } catch (error: any) {
    console.error("ERROR CRÍTICO EN CARGA MASIVA:", error.message);
    res.status(500).json({ message: 'Error interno en carga masiva', error: error.message });
  }
});

app.put('/api/inventory/:id', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const item = await itemRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });

    const oldStatus = item.status;
    const oldStockDef = item.stockDefectuoso || 0;
    Object.assign(item, req.body);
    const updated = await itemRepo.save(item) as any;

    const statusChangedToMaint = ['Defectuoso', 'En Mantención'].includes(updated.status) && !['Defectuoso', 'En Mantención'].includes(oldStatus);
    const stockDefIncreased = updated.stockDefectuoso > oldStockDef;

    // Si el equipo se marca como Defectuoso/Mantención o aumenta el stock defectuoso, crear automáticamente una tarea de mantención
    if (statusChangedToMaint || stockDefIncreased) {
      try {
        const maintRepo = AppDataSource.getRepository(MaintenanceTask);
        
        // Verificar si ya hay una tarea pendiente o en progreso para este item para evitar duplicados
        const existingTask = await maintRepo.findOne({
            where: { 
                itemId: updated.id,
                status: Not(In(['Finalizado', 'Cancelado'] as any))
            }
        });

        if (!existingTask) {
            const newTask = maintRepo.create({
                itemId: updated.id,
                itemName: `${updated.marca} ${updated.modelo}`,
                type: 'Correctivo',
                priority: 'Alta',
                status: 'Pendiente',
                technician: 'Por asignar',
                cost: 0,
                description: `Auto-generado: Equipo reportado como ${updated.status.toUpperCase()} ${stockDefIncreased ? '(Aumento de Stock Defectuoso)' : ''} (SN: ${updated.sn || 'S/N'}).`,
                dateScheduled: new Date().toISOString().split('T')[0]
            });
            await maintRepo.save(newTask);
            console.log(`[AUTO-MAINT] Creada orden correctiva para item ${updated.id}`);
        }
      } catch (maintError) {
        console.error("Error al crear tarea de mantención automática:", maintError);
      }
    }

    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_UPDATE', `Item actualizado: ${updated.marca} ${updated.modelo} - ${updated.status}`);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar item' });
  }
});

app.delete('/api/inventory/:id', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  try {
    await AppDataSource.getRepository(InventoryItem).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar item' });
  }
});

// Endpoint para vaciar TODO el inventario
app.delete('/api/inventory/mass/clear', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    await itemRepo.clear(); // Esto vacía la tabla por completo
    res.status(204).send();
  } catch (error) {
    console.error("Error clearing inventory:", error);
    res.status(500).json({ message: 'Error al vaciar el inventario' });
  }
});

// --- ENDPOINTS DE RESERVAS ---

// --- RESERVAS DE SALAS (REPARADO Y TRAZABLE) ---
app.post('/api/room-reservations', authMiddleware, checkPermission(ROLES.RESERVATION_USERS), async (req: any, res) => {
  try {
    const resRepo = AppDataSource.getRepository(RoomReservation);
    const reservation = resRepo.create({
      ...req.body,
      userCorreo: req.user.correo,
      userName: req.user.nombre,
      userId: req.user.id,
      estado: req.user.rol.includes('Admin') ? 'Aprobada' : 'Pendiente'
    });
    const saved: any = await resRepo.save(reservation);
    
    // [TRAZABILIDAD UAH] Enriquecer el detalle para el Dashboard antes de loguear
    const roomRepo = AppDataSource.getRepository(Room);
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    const room = await roomRepo.findOneBy({ id: saved.roomId });
    const block = await blockRepo.findOneBy({ id: saved.roomBlockId });
    
    const detalleFinal = `Reserva sala ${room?.nombre || 'Indefinida'} (${saved.fechaExacta})`;
    await logRequest(req, 'SALA', detalleFinal, saved.id, block?.nombreBloque || 'S/H');
    
    // [NOTIFICACIÓN] Avisar a los administradores de la nueva reserva de sala
    await createNotification('all', 'Nueva Reserva de Sala', `${req.user.nombre} reservó ${room?.nombre || 'Sala'} para el ${saved.fechaExacta}`, 'info');

    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Función Auxiliar de Trazabilidad Unificada (Caja Negra)
async function logRequest(req: any, tipo: string, detalle: string, recId: number, horario: string = 'N/A', forceStatus?: string) {
    try {
        const logRepo = AppDataSource.getRepository(ProcurementRequest);
        const isAdminAction = req.user.rol.includes('Admin') || req.user.rol === 'SuperUser';
        const newLog = logRepo.create({
            usuario: req.user.nombre,
            correo: req.user.correo,
            tipoItem: tipo,
            detalle: detalle,
            horario: horario,
            recId: recId,
            status: forceStatus || (isAdminAction ? 'Aprobado' : 'Pendiente'),
            fecha: new Date().toISOString()
        });
        await logRepo.save(newLog);
    } catch (e) {
        console.error("Error en Trazabilidad Log:", e);
    }
}

app.delete('/api/room-reservations/:id', authMiddleware, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const resRepo = AppDataSource.getRepository(RoomReservation);
        const logRepo = AppDataSource.getRepository(ProcurementRequest);

        // Limpiar registro en Caja Negra si existe para mantener el Dashboard sincronizado
        await logRepo.delete({ recId: id, tipoItem: 'SALA' });
        
        const result = await resRepo.delete(id);
        if (result.affected === 0) return res.status(404).json({ message: 'Reserva no encontrada' });

        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RES_DELETE', `Reserva de sala eliminada ID: ${id}`);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar reserva de sala', detail: error.message });
    }
});

app.delete('/api/reservations/:id', authMiddleware, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const resRepo = AppDataSource.getRepository(Reservation);
        const logRepo = AppDataSource.getRepository(ProcurementRequest);

        // Limpiar registro en Caja Negra si existe
        await logRepo.delete({ recId: id, tipoItem: Not('SALA') as any });
        
        const result = await resRepo.delete(id);
        if (result.affected === 0) return res.status(404).json({ message: 'Reserva no encontrada' });

        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_DELETE', `Reserva de laboratorio eliminada ID: ${id}`);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar reserva', detail: error.message });
    }
});

// NUEVO: Limpieza Administrativa de Solicitudes (Borra registros de Auditoría/Trazabilidad)
app.delete('/api/procurement-requests/mass/clear-ghosts', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(ProcurementRequest);
    // Borramos todas las cargas masivas o actualizaciones que quedaron 'Pendientes' por error
    const result = await repo.createQueryBuilder()
        .delete()
        .where("status = :status", { status: 'Pendiente' })
        .andWhere("(detalle LIKE :m1 OR detalle LIKE :m2 OR detalle LIKE :m3)", { m1: '%Carga masiva%', m2: '%Update%', m3: '%Actualización%' })
        .execute();
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'LOGS_PURGE', `Limpieza masiva de ${result.affected} registros fantasma`);
    res.json({ message: 'Limpieza completada', affected: result.affected });
  } catch (error) {
    res.status(500).json({ message: 'Error en purga masiva' });
  }
});

app.get('/api/reservations', authMiddleware, async (req, res) => {
  const reservations = await AppDataSource.getRepository(Reservation).find();
  res.json(reservations);
});

app.post('/api/reservations', authMiddleware, async (req: any, res) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const newRes = resRepo.create(req.body);
    const savedRes = await resRepo.save(newRes) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_CREATE', `Reserva creada: ${savedRes.bloque} - ${savedRes.fecha}`);
    res.status(201).json(savedRes);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear reserva' });
  }
});

app.put('/api/reservations/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser para gestionar reservas' });
  }
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    Object.assign(reservation, req.body);
    const updated = await resRepo.save(reservation) as any;
    
    // Si se aprueba, loguear
    if (req.body.aprobada && !reservation.aprobada) {
       await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_APPROVE', `Reserva aprobada: ID ${updated.id} para ${updated.nombreSolicitante}`);
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar reserva' });
  }
});

app.post('/api/reservations/:id/check-in', authMiddleware, async (req: any, res) => {
  const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    reservation.clockIn = new Date();
    await resRepo.save(reservation);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_IN', `Ingreso registrado: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error en check-in' });
  }
});

app.post('/api/reservations/:id/check-out', authMiddleware, async (req: any, res) => {
  const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    reservation.clockOut = new Date();
    await resRepo.save(reservation);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_OUT', `Salida registrada: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error en check-out' });
  }
});

// --- ENDPOINTS DE COMPRAS (PURCHASE ORDERS) ---

app.get('/api/procurement', authMiddleware, async (req: any, res) => {
  const orders = await AppDataSource.getRepository(PurchaseOrder).find();
  res.json(orders);
});

app.post('/api/procurement', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const orderRepo = AppDataSource.getRepository(PurchaseOrder);
    const newOrder = orderRepo.create(req.body);
    await orderRepo.save(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear orden de compra' });
  }
});

app.post('/api/procurement/bulk', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const orderRepo = AppDataSource.getRepository(PurchaseOrder);
    const orders = req.body;
    if (!Array.isArray(orders)) return res.status(400).json({ message: 'Se esperaba un array' });

    const savedOrders = await orderRepo.save(orderRepo.create(orders));
    
    // [NOTIFICACIÓN CONSOLIDADA]
    await createNotification('all', 'Nueva Importación de Compras', `Se han cargado ${savedOrders.length} nuevas solicitudes por ${req.user.nombre}`, 'info');
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'PROCUREMENT_BULK', `Importación masiva: ${savedOrders.length} registros`);
    
    res.status(201).json(savedOrders);
  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN IMPORTACIÓN MASIVA:", error);
    res.status(500).json({ 
      message: 'Error en importación masiva', 
      details: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});


app.put('/api/procurement/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const orderRepo = AppDataSource.getRepository(PurchaseOrder);
    const order = await orderRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    Object.assign(order, req.body);
    await orderRepo.save(order);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar orden' });
  }
});

app.delete('/api/procurement/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    await AppDataSource.getRepository(PurchaseOrder).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar orden' });
  }
});

// --- ENDPOINTS DE TAREAS ADMIN (TO-DO) ---

app.get('/api/admin-tasks', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  const tasks = await AppDataSource.getRepository(AdminTask).find({ order: { createdAt: 'DESC' } });
  res.json(tasks);
});

app.post('/api/admin-tasks', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const taskRepo = AppDataSource.getRepository(AdminTask);
    const newTask = taskRepo.create(req.body);
    await taskRepo.save(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear tarea' });
  }
});

app.put('/api/admin-tasks/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const taskRepo = AppDataSource.getRepository(AdminTask);
    const task = await taskRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    Object.assign(task, req.body);
    await taskRepo.save(task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar tarea' });
  }
});

app.delete('/api/admin-tasks/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    await AppDataSource.getRepository(AdminTask).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea' });
  }
});

// --- GESTIÓN DE MANTENCIÓN API ---
app.post('/api/maintenance/reset-db', authMiddleware, async (req: any, res) => {
    if (req.user.rol !== 'SuperUser') return res.status(403).json({ message: 'Solo SuperUser puede resetear la BD' });
    try {
        // nuclear option: Vaciar tablas críticas manteniendo usuarios
        const tables = [
            'inventory_item', 
            'purchase_order', 
            'room_reservation', 
            'reservation', 
            'procurement_request', 
            'audit_log', 
            'notification', 
            'ticket', 
            'message'
        ];
        
        for (const table of tables) {
            await AppDataSource.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        }
        
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'DB_RESET', 'REINICIO TOTAL DE BASE DE DATOS (NUCLEAR OPTION)');
        res.json({ message: 'Base de datos reiniciada correctamente' });
    } catch (error: any) {
        res.status(500).json({ error: 'Error al resetear la base de datos', detail: error.message });
    }
});

// --- ENDPOINTS DE MANTENCIÓN ---
app.get('/api/maintenance', authMiddleware, async (req: any, res) => {
  const canSee = ROLES.ADMIN_STUFF.includes(req.user.rol) || req.user.rol === 'SuperUser';
  const tasks = await AppDataSource.getRepository(MaintenanceTask).find({ order: { dateScheduled: 'DESC' } });
  res.json(tasks);
});

// --- SEGURIDAD Y CAJA NEGRA (SOLO SUPERUSER) ---
app.get('/api/audit-logs', authMiddleware, checkPermission(ROLES.SECURITY_ONLY), async (req: any, res) => {
  const logs = await AppDataSource.getRepository(AuditLog).find({ order: { id: "DESC" }, take: 100 });
  res.json(logs);
});

app.post('/api/maintenance', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const maintRepo = AppDataSource.getRepository(MaintenanceTask);
    const newTask = maintRepo.create(req.body);
    await maintRepo.save(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear tarea de mantención' });
  }
});

app.put('/api/maintenance/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    const maintRepo = AppDataSource.getRepository(MaintenanceTask);
    const task = await maintRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!task) return res.status(404).json({ message: 'Tarea no encontrada' });
    Object.assign(task, req.body);
    await maintRepo.save(task);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar tarea de mantención' });
  }
});

app.delete('/api/maintenance/:id', authMiddleware, async (req: any, res) => {
  if (!['SuperUser', 'Admin_Labs'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol Admin_Labs o SuperUser' });
  }
  try {
    await AppDataSource.getRepository(MaintenanceTask).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea de mantención' });
  }
});


// --- ENDPOINTS DE PROYECTOS ---
app.get('/api/projects', authMiddleware, async (req: any, res) => {
  const canSee = ROLES.ADMIN_STUFF.includes(req.user.rol);
  const projects = await AppDataSource.getRepository(Project).find({ order: { id: 'DESC' } });
  res.json(projects);
});

// ENDPOINT UNIFICADO: Caja Negra / Historial de Solicitudes (Salas + Equipos + Auditoría)
app.get('/api/procurement-requests', authMiddleware, async (req: any, res) => {
  try {
    const logRepo = AppDataSource.getRepository(ProcurementRequest);
    let requests;
    
    // Si es Admin/Superuser ve todo (Buscador Global)
    if (ROLES.ADMIN_STUFF.includes(req.user.rol)) {
      const { search } = req.query;
      if (search) {
        requests = await logRepo.createQueryBuilder("req")
          .where("LOWER(req.usuario) LIKE LOWER(:search) OR LOWER(req.detalle) LIKE LOWER(:search) OR LOWER(req.tipoItem) LIKE LOWER(:search)", { search: `%${search}%` })
          .orderBy("req.id", "DESC")
          .getMany();
      } else {
        requests = await logRepo.find({ order: { id: "DESC" } });
      }
    } else {
      // Alumno/Docente solo ve lo suyo
      requests = await logRepo.find({ 
        where: { correo: req.user.correo },
        order: { id: "DESC" }
      });
    }
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/procurement-requests/:id', authMiddleware, async (req: any, res) => {
    if (req.user.rol !== 'SuperUser') {
      return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser puede realizar purgas físicas.' });
    }
    try {
      const id = parseInt(req.params.id);
      const logRepo = AppDataSource.getRepository(ProcurementRequest);
      const request = await logRepo.findOneBy({ id });
  
      if (!request) return res.status(404).json({ message: 'Registro no encontrado en la Caja Negra' });
  
      // Intento de borrado en cascada manual (si tiene recId)
      if (request.recId) {
          try {
              if (request.tipoItem === 'SALA') {
                  await AppDataSource.getRepository(RoomReservation).delete(request.recId);
              } else {
                  await AppDataSource.getRepository(Reservation).delete(request.recId);
              }
          } catch (e) {
              console.warn(`[CLEANUP] No se pudo borrar la reserva física ${request.recId}, procediendo solo con el log.`);
          }
      }
  
      await logRepo.delete(id);
      await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'PURGE_REQUEST', `Eliminación física de solicitud ID ${id} (${request.detalle})`);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: 'Error al purgar registro', detail: error.message });
    }
});

// Eliminada ruta duplicada de proyectos

app.post('/api/projects', authMiddleware, async (req: any, res) => {
  const canManage = ['SuperUser', 'Admin_Labs', 'Admin_Acade'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const repo = AppDataSource.getRepository(Project);
    const project = repo.create(req.body);
    await repo.save(project);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear proyecto' });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const repo = AppDataSource.getRepository(Project);
    try {
        const existingProject = await repo.findOne({ where: { id } });
        if (!existingProject) return res.status(404).json({ error: "Proyecto no encontrado" });

        // Permitimos que 'tasks' se grabe en updateData directamente (como JSONB)
        const { id: _, createdAt, updatedAt, manager, ...updateData } = req.body;
        
        await repo.update(id, updateData);
        
        const finalProject = await repo.findOne({ where: { id }, relations: ['manager'] });
        res.json(finalProject);
    } catch (error: any) {
        console.error("Error crítico al actualizar proyecto:", error);
        res.status(400).json({ error: "Error de consistencia en base de datos", message: error.message });
    }
});

app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const repo = AppDataSource.getRepository(Project);
    
    // [LIMPIEZA SEGURA] Borrar tareas vinculadas en tabla física si existen (evita Error 500 FK constraint)
    try {
        await AppDataSource.query('DELETE FROM "project_task" WHERE "projectId" = $1', [id]);
    } catch (e) {
        // Ignorar si la tabla no existe o no tiene esas columnas
        console.warn(`[CLEANUP] No se encontraron tareas físicas para el proyecto ${id}, procediendo con borrado estándar.`);
    }

    const result = await repo.delete(id);
    if (result.affected === 0) return res.status(404).json({ message: 'Proyecto no encontrado' });
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'PROJECT_DELETE', `Proyecto eliminado ID: ${id}`);
    res.status(204).send();
  } catch (error: any) {
    console.error('[DATABASE ERROR]: Fallo al eliminar proyecto.', error.message);
    res.status(500).json({ error: 'Error al eliminar proyecto', detail: error.message });
  }
});



// --- ENDPOINTS DE WIKI/DOCUMENTACIÓN ---

app.get('/api/wiki', authMiddleware, async (req: any, res) => {
  const isAdmin = ['SuperUser', 'Admin_Labs', 'Admin_Acade'].includes(req.user.rol);
  const repo = AppDataSource.getRepository(WikiDoc);
  
  let docs;
  if (isAdmin) {
    docs = await repo.find({ order: { createdAt: 'DESC' } });
  } else {
    docs = await repo.find({ 
      where: { isPublic: true },
      order: { createdAt: 'DESC' } 
    });
  }
  res.json(docs);
});

app.post('/api/wiki', authMiddleware, async (req: any, res) => {
  const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const repo = AppDataSource.getRepository(WikiDoc);
    const doc = repo.create(req.body);
    await repo.save(doc);
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear documento' });
  }
});

app.put('/api/wiki/:id', authMiddleware, async (req: any, res) => {
    const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = AppDataSource.getRepository(WikiDoc);
        const doc = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });
        
        Object.assign(doc, req.body);
        await repo.save(doc);
        res.json(doc);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar documento' });
    }
});

app.delete('/api/wiki/:id', authMiddleware, async (req: any, res) => {
    const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
    await AppDataSource.getRepository(WikiDoc).delete(req.params.id);
    res.status(204).send();
});


// --- LÓGICA DE SOCKETS (SOPORTE) ---
io.on('connection', async (socket) => {
  const ticketRepo = AppDataSource.getRepository(Ticket);
  const msgRepo = AppDataSource.getRepository(Message);

  // Unirse a salas según rol al conectar
  socket.on('join', (data) => {
    const { userId, role, name } = data;
    console.log(`Solicitud de entrada a sala: UserID=${userId}, Rol=${role}, Nombre=${name}`);
    (socket as any).userName = name; // Guardar nombre en el socket
    (socket as any).userRole = role;
    if (role === 'Admin' || role === 'SuperUser') {
      socket.join('admins');
      console.log(`Socket ${socket.id} se unió a sala 'admins'`);
    }
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} se unió a sala privada 'user_${userId}'`);
    }
  });

  // Al conectar, enviar tickets existentes (filtrados si no es admin, pero el frontend lo maneja por ahora)
  const allTickets = await ticketRepo.find({ relations: ['messages'], order: { updatedAt: 'DESC' } });
  socket.emit('init', { tickets: allTickets });

  // Crear nuevo ticket
  socket.on('ticket:create', async (data) => {
    try {
      const { id, subject, userId, userName, messages } = data;
      const firstMsg = messages[0];

      // Buscar email del usuario (opcional)
      let user = null;
      if (userId && userId !== 0) {
        user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
      }

      // Extraer email del texto si es un ticket de invitado (formato: "Email: ...")
      let userEmail = user?.correo || 'N/A';
      if (userEmail === 'N/A' && firstMsg.text.includes('Email:')) {
        const emailMatch = firstMsg.text.match(/Email:\s*([^\s\n\r]+)/);
        if (emailMatch) userEmail = emailMatch[1];
      }

      const newTicket = ticketRepo.create({
        id: String(id),
        subject,
        userId: userId || 0,
        userName,
        userEmail: userEmail,
        status: 'Open',
        lastMessage: firstMsg.text,
        lastUpdate: new Date().toISOString()
      });

      await ticketRepo.save(newTicket);

      const newMessage = msgRepo.create({
        ticketId: String(id),
        text: firstMsg.text,
        sender: firstMsg.sender,
        senderRole: firstMsg.role || 'user',
        timestamp: new Date().toISOString(),
        ticket: newTicket
      });

      await msgRepo.save(newMessage);

      await logAudit(userName, userEmail, user?.rol || 'Visitante', 'CREATE_TICKET', `Ticket creado: ${subject}`);

      // Añadir el mensaje al objeto ticket para la emisión
      newTicket.messages = [newMessage];

      // Notificar a administradores y al propio usuario
      console.log(`Emitiendo ticket:created a 'admins' ${userId ? `y 'user_${userId}'` : ''}`);
      const emitter = io.to('admins');
      if (userId && userId !== 0) emitter.to(`user_${userId}`);
      emitter.emit('ticket:created', newTicket);

      // [PERSISTENCIA TOTAL] Guardar notificación en BD para Administradores
      const notifRepo = AppDataSource.getRepository(Notification);
      await notifRepo.save(notifRepo.create({
        userId: 'all',
        title: 'Nuevo Ticket Soporte',
        message: `${userName}: ${subject}`,
        type: 'info'
      }));
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  });

  // Enviar mensaje en ticket existente
  socket.on('message:send', async (data) => {
    try {
      const { ticketId, text, sender, role } = data;
      const ticket = await ticketRepo.findOneBy({ id: String(ticketId) });

      if (!ticket) return;

      const newMessage = msgRepo.create({
        ticketId: String(ticketId),
        text,
        sender,
        senderRole: role,
        timestamp: new Date().toISOString(),
        ticket: ticket
      });

      await msgRepo.save(newMessage);

      await logAudit(sender, 'N/A', role, 'SEND_MESSAGE', `Mensaje en ticket ${ticketId}: ${text.substring(0,20)}...`);

      // Actualizar metadata del ticket
      ticket.lastMessage = text;
      ticket.lastUpdate = new Date().toISOString();
      await ticketRepo.save(ticket);

      const payload = {
        ...newMessage,
        ticketId: parseInt(ticketId as any) // Frontend espera número en message:received
      };

      // Emitir solo a los involucrados: Admins y el dueño del ticket
      console.log(`Emitiendo message:received a 'admins' y 'user_${ticket.userId}'`);
      io.to('admins').to(`user_${ticket.userId}`).emit('message:received', payload);

      // [PERSISTENCIA TOTAL] Guardar notificación en BD
      const notifRepo = AppDataSource.getRepository(Notification);
      const isAdmin = ['SuperUser', 'Admin_Labs', 'Admin_Acade', 'Academico'].includes(role);
      await notifRepo.save(notifRepo.create({
        userId: isAdmin ? ticket.userId.toString() : 'all',
        title: 'Nuevo Mensaje Soporte',
        message: `${sender}: ${text.substring(0, 30)}...`,
        type: 'info'
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Cerrar/Actualizar ticket (con Log)
  socket.on('ticket:update_status', async ({ ticketId, status }) => {
    try {
      const ticket = await ticketRepo.findOneBy({ id: String(ticketId) });
      if (ticket) {
        ticket.status = status;
        await ticketRepo.save(ticket);

        // Crear mensaje de log interno
        const adminName = (socket as any).userName || 'Administrador';
        const logMsg = msgRepo.create({
          ticketId: String(ticketId),
          text: `[SISTEMA]: El ticket ha sido marcado como ${
            status === 'Open' ? 'ABIERTO' : status === 'In Progress' ? 'EN CURSO' : 'CERRADO'
          } por ${adminName}.`,
          sender: 'Sistema',
          senderRole: 'admin',
          timestamp: new Date().toISOString(),
          ticket: ticket
        });
        await msgRepo.save(logMsg);

        io.to('admins').to(`user_${ticket.userId}`).emit('message:received', {
          ...logMsg,
          ticketId: parseInt(ticketId as any),
          newStatus: status
        });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  });

  // Eliminar ticket (Solo Admins)
  socket.on('ticket:delete', async ({ ticketId }) => {
    try {
      const role = (socket as any).userRole;
      const isAdmin = ['SuperUser', 'Admin_Labs'].includes(role);
      if (!isAdmin) return;

      const ticket = await ticketRepo.findOne({ where: { id: String(ticketId) }, relations: ['messages'] });
      if (ticket) {
        // Eliminar mensajes primero
        if (ticket.messages) {
          await msgRepo.remove(ticket.messages);
        }
        await ticketRepo.remove(ticket);

        // Notificar a todos para que actualicen sus listas
        io.to('admins').to(`user_${ticket.userId}`).emit('ticket:deleted', { ticketId });
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


// Eliminada sección duplicada de Wiki institucional (gestionada arriba)

// --- ENDPOINTS DE BITACORA ---

app.get('/api/bitacora', authMiddleware, async (req: any, res) => {
  // Bitácora puede ser vista por SuperUser y Admin_Labs
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') {
    return res.status(403).json({ message: 'Acceso denegado: Solo SuperUser y Admin_Labs pueden ver la Bitácora' });
  }
  const repo = AppDataSource.getRepository(Bitacora);
  const entries = await repo.find({ order: { id: 'DESC' } });
  res.json(entries);
});

app.post('/api/bitacora', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const repo = AppDataSource.getRepository(Bitacora);
    const entry = repo.create({
        ...req.body,
        adminName: req.user.nombre,
        adminId: req.user.id
    });
    const savedEntry = await repo.save(entry) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_ENTRY', `Nueva anotación: ${savedEntry.section} - ${savedEntry.type}`);
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear entrada en bitácora' });
  }
});

app.put('/api/bitacora/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser') return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser gestiona la bitacora' });
  try {
    const repo = AppDataSource.getRepository(Bitacora);
    const entry = await repo.findOneBy({ id: parseInt(req.params.id) });
    if (!entry) return res.status(404).json({ message: 'Entrada no encontrada' });
    
    Object.assign(entry, req.body);
    await repo.save(entry);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_EDIT', `Anotación editada: ${entry.id}`);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar entrada en bitácora' });
  }
});

app.delete('/api/bitacora/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') return res.status(403).json({ message: 'Acceso denegado' });
  await AppDataSource.getRepository(Bitacora).delete(req.params.id);
  res.status(204).send();
});

// --- UTILIDAD DE NOTIFICACIONES (UAH) ---
async function createNotification(userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notif = repo.create({
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date()
    });
    await repo.save(notif);
    
    // Opcional: Emitir vía socket si es necesario para tiempo real instantáneo aparte del polling
    io.emit('notification:new', notif); 
  } catch (error) {
    console.error("Error al persistir notificación:", error);
  }
}

// --- API DE NOTIFICACIONES (PERSISTENCIA TOTAL) ---
app.get('/api/notifications', authMiddleware, async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notifications = await repo.find({
      where: [
        { userId: req.user.id.toString() },
        { userId: 'all' }
      ],
      order: { createdAt: 'DESC' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
});

app.post('/api/notifications', authMiddleware, async (req: any, res) => {
  const isAdmin = ROLES.ADMIN_STUFF.includes(req.user.rol);
  if (!isAdmin && req.body.userId === 'all') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notif = repo.create({ ...req.body, createdAt: new Date() });
    await repo.save(notif);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear notificación' });
  }
});

app.patch('/api/notifications/:id/read', authMiddleware, async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notif = await repo.findOneBy({ id: parseInt(req.params.id) });
    if (notif) {
      notif.read = true;
      await repo.save(notif);
    }
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificación' });
  }
});

app.post('/api/notifications/mark-all-read', authMiddleware, async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    await repo.createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where("userId = :userId OR userId = 'all'", { userId: req.user.id.toString() })
      .execute();
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificaciones' });
  }
});

app.delete('/api/notifications/all', authMiddleware, async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    await repo.delete({ userId: req.user.id.toString() });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar notificaciones' });
  }
});


app.delete('/api/schedules/lab/:lab', authMiddleware, async (req: any, res) => {
  // Acad_Labs puede borrar sus propios horarios sincronizados
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs' && req.user.rol !== 'Acad_Labs') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const labName = req.params.lab;
    
    // 1. Eliminar horarios de Schedule
    await AppDataSource.getRepository(Schedule).delete({ lab: labName });

    // 2. [SINCRONIZACIÓN] Eliminar Room asociado (SIN PROTECCIONES)
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOneBy({ nombre: labName });
    if (room) {
      console.log(`[SYNC] Eliminando sala sincronizada desde Schedule: ${labName}`);
      await AppDataSource.getRepository(RoomBlock).delete({ roomId: room.id });
      await AppDataSource.getRepository(RoomReservation).delete({ roomId: room.id });
      await roomRepo.delete(room.id);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar laboratorio sincronizado:", error);
    res.status(500).json({ message: 'Error al eliminar horarios del laboratorio' });
  }
});

// --- ENDPOINTS DE SALAS Y RESERVAS (ROOMS) ---

app.get('/api/rooms', authMiddleware, async (req: any, res) => {
  try {
    const repo = AppDataSource.getRepository(Room);
    const rooms = await repo.find({ order: { nombre: 'ASC' } });
    console.log(`[GET /api/rooms] Retornando ${rooms.length} salas`);
    res.json(rooms);
  } catch(e: any) {
    console.error('[GET /api/rooms] Fallback Raw Query Activado:', e.message);
    try {
        // FALLBACK: Mismo esquema que Reservas, cargamos Raw y normalizamos para el frontend
        const rooms = await AppDataSource.query('SELECT * FROM "room" ORDER BY "nombre" ASC');
        const normalizedRooms = rooms.map((r: any) => ({
            ...r,
            metrosCuadrados: r.metrosCuadrados || 0,
            valorHora: r.valorHora || 0,
            tieneAireAcondicionado: !!r.tieneAireAcondicionado,
            tieneProyector: !!r.tieneProyector,
            tieneTelevisor: !!r.tieneTelevisor,
            tienePizarra: !!r.tienePizarra,
            tieneAudio: !!r.tieneAudio,
            tieneComputadores: !!r.tieneComputadores,
            tieneMicrofono: !!r.tieneMicrofono,
            tieneNotebooks: !!r.tieneNotebooks,
            tienePizarraInteligente: !!r.tienePizarraInteligente,
            tieneLavadero: !!r.tieneLavadero,
            tieneDucha: !!r.tieneDucha,
            tieneBano: !!r.tieneBano,
            otrosEquipos: r.otrosEquipos || '',
            estadoActivo: r.estadoActivo !== false // true por defecto
        }));
        res.json(normalizedRooms);
    } catch(fallbackErr: any) {
        res.status(500).json({ message: 'Error total en salas', error: fallbackErr.message });
    }
  }
});

app.post('/api/rooms', authMiddleware, async (req: any, res) => {
  // Admin_Labs y SuperUser pueden crear salas
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser o Admin_Labs puede crear salas' });
  }
  try {
    const repo = AppDataSource.getRepository(Room);
    const room = repo.create(req.body as object);
    const savedRoom: any = await repo.save(room);

    // Generar bloques por defecto (8:30 a 18:50 usualmente, 10 bloques)
    const blocks = [
        { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
        { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
        { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
        { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
        { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
        { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
        { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
    ];
    
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    for (const b of blocks) {
        await blockRepo.save(blockRepo.create({
            roomId: savedRoom.id,
            nombreBloque: b.nombre,
            horaInicio: b.inicio,
            horaFin: b.fin
        }));
    }

    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_CREATE', `Sala creada: ${savedRoom.nombre}`);
    res.status(201).json(savedRoom);
  } catch(e) {
    res.status(400).json({ message: 'Error al crear sala' });
  }
});

app.put('/api/rooms/:id', authMiddleware, async (req: any, res) => {
  // SuperUser y Admin_Labs pueden editar salas
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser o Admin_Labs puede editar salas' });
  }
  try {
    const repo = AppDataSource.getRepository(Room);
    const room = await repo.findOneBy({ id: parseInt(req.params.id) });
    if (!room) return res.status(404).json({ message: 'Sala no encontrada' });
    Object.assign(room, req.body);
    await repo.save(room);
    res.json(room);
  } catch(e) {
    res.status(400).json({ message: 'Error al actualizar sala' });
  }
});

app.delete('/api/rooms/:id', authMiddleware, async (req: any, res) => {
  // SuperUser y Admin_Labs pueden eliminar salas
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin_Labs') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser o Admin_Labs puede eliminar salas' });
  }
  try {
    const roomId = parseInt(req.params.id);
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOneBy({ id: roomId });
    
    if (room) {
      console.log(`[DELETE SYNC] Intentando eliminar sala: ${room.nombre}`);
      
      // 1. Eliminar de Schedule (Horarios Académicos)
      try {
        await AppDataSource.getRepository(Schedule).delete({ lab: room.nombre });
      } catch(e) { console.error('Error Schedule delete:', e); }

      // 2. IMPORTANTE: ELIMINAR RESERVAS PRIMERO (Para evitar error de FK con bloques)
      try {
        await AppDataSource.getRepository(RoomReservation).delete({ roomId });
      } catch(e) { console.error('Error Reservations delete:', e); }

      // 3. ELIMINAR BLOQUES
      try {
        await AppDataSource.getRepository(RoomBlock).delete({ roomId });
      } catch(e) { console.error('Error Blocks delete:', e); }

      // 4. ELIMINAR LA SALA
      await roomRepo.delete(roomId);
      
      await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_DELETE', `Sala eliminada: ${room.nombre}`);
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Sala no encontrada' });
    }
  } catch(e) {
    console.error('[DELETE ROOM ERROR]:', e);
    res.status(500).json({ message: 'Error interno al eliminar sala' });
  }
});

// Bloques de la sala
app.get('/api/rooms/:id/blocks', authMiddleware, async (req: any, res) => {
    const repo = AppDataSource.getRepository(RoomBlock);
    const blocks = await repo.find({ where: { roomId: parseInt(req.params.id) }, order: { horaInicio: 'ASC' } });
    res.json(blocks);
});

// Editar un bloque existente
app.put('/api/room-blocks/:id', authMiddleware, async (req: any, res) => {
    const canManage = ['SuperUser', 'Admin_Labs'].includes(req.user.rol);
  if (!canManage) return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = AppDataSource.getRepository(RoomBlock);
        const block = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!block) return res.status(404).json({ message: 'Bloque no encontrado' });
        Object.assign(block, req.body);
        await repo.save(block);
        res.json(block);
    } catch(e) {
        res.status(400).json({ message: 'Error al modificar bloque' });
    }
});

// Reservas de salas
app.get('/api/room-reservations', authMiddleware, async (req: any, res) => {
    try {
        const repo = AppDataSource.getRepository(RoomReservation);
        const filters: any = {};
        if (req.query.roomId) filters.roomId = parseInt(req.query.roomId as string);
        if (req.query.fecha) filters.fechaExacta = req.query.fecha as string;
        
        const reservations = await repo.find({ where: filters });
        res.json(reservations);
    } catch(e: any) {
        console.error('[GET /api/room-reservations] Fallback Raw Query Activado:', e.message);
        try {
            // FALLBACK: Si no podemos cargar vía Entity (schema mismatch), cargamos raw y mapeamos manualmente
            const query = `SELECT * FROM "room_reservation" ${req.query.fecha ? `WHERE "fechaExacta" = '${req.query.fecha}'` : ''}`;
            const reservations = await AppDataSource.query(query);
            res.json(reservations.map((r: any) => ({
                ...r,
                color: r.color || '#3b82f6' // Default si falta la columna
            })));
        } catch(fallbackErr: any) {
            res.status(500).json({ message: 'Error total en reservas', error: fallbackErr.message });
        }
    }
});


app.put('/api/room-reservations/:id/status', authMiddleware, checkPermission(ROLES.ADMIN_STUFF), async (req: any, res) => {
  // Admin_Acade y Admin_Labs pueden aprobar/rechazar reservas según su área
    try {
        const repo = AppDataSource.getRepository(RoomReservation);
        const reserve = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!reserve) return res.status(404).json({ message: 'Reserva no encontrada' });
        
        reserve.estado = req.body.estado; // 'Aprobada' o 'Rechazada'
        if (req.body.motivoRechazo) reserve.motivoRechazo = req.body.motivoRechazo;

        await repo.save(reserve);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RES_STATUS', `Reserva ${reserve.id} cambió a ${reserve.estado}`);

        // [TRAZABILIDAD] Actualizar el estado en el historial unificado también
        const histRepo = AppDataSource.getRepository(ProcurementRequest);
        const historyEntry = await histRepo.findOne({ where: { recId: reserve.id, tipoItem: 'SALA' } });
        if (historyEntry) {
            historyEntry.status = reserve.estado;
            await histRepo.save(historyEntry);
        }

        res.json(reserve);
    } catch(e) {
        res.status(400).json({ message: 'Error al actualizar estado de reserva' });
    }
});

// --- ENDPOINTS DE DIAGNOSTICO ---
// Eliminado endpoint de diagnóstico nuke por seguridad

app.get('/api/diag/schema', async (req, res) => {
    try {
        const dbType = AppDataSource.options.type;
        let rooms: any[] = [];
        let resvs: any[] = [];
        
        if (dbType === 'postgres') {
            rooms = await AppDataSource.query(`SELECT column_name as name FROM information_schema.columns WHERE lower(table_name) = 'room'`);
            resvs = await AppDataSource.query(`SELECT column_name as name FROM information_schema.columns WHERE lower(table_name) = 'room_reservation'`);
        } else {
            const r = await AppDataSource.query(`PRAGMA table_info("room")`);
            const v = await AppDataSource.query(`PRAGMA table_info("room_reservation")`);
            rooms = r.map((c: any) => ({ name: c.name }));
            resvs = v.map((c: any) => ({ name: c.name }));
        }

        res.json({
            dbType,
            rooms: rooms.map((c: any) => c.name),
            reservations: resvs.map((c: any) => c.name)
        });
    } catch(e: any) {
        res.status(500).json({ error: 'Fallo al obtener esquema', details: e.message });
    }
});

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
