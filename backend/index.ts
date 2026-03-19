import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import "reflect-metadata";
import { AppDataSource } from './data-source';
import { Ticket } from '../src/entities/Ticket';
import { Message } from '../src/entities/Message';
import { User } from '../src/entities/User';
import { Schedule } from '../src/entities/Schedule';
import { InventoryItem } from '../src/entities/InventoryItem';
import { Reservation } from '../src/entities/Reservation';
import { AdminTask } from '../src/entities/AdminTask';
import { MaintenanceTask } from '../src/entities/MaintenanceTask';
import { PurchaseOrder } from '../src/entities/PurchaseOrder';
import { AuditLog } from '../src/entities/AuditLog';
import { Project } from '../src/entities/Project';
import { ProjectTask } from '../src/entities/ProjectTask';
import { WikiDoc } from '../src/entities/WikiDoc';
import { Bitacora } from '../src/entities/Bitacora';
import dotenv from "dotenv";
import helmet from "helmet";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "*"
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'uah_secret_fallback';

// Inicializar DB y Admin
AppDataSource.initialize()
  .then(async () => {
    console.log("DB Conectada");
    // Crear admin inicial si no existe
    const userRepo = AppDataSource.getRepository(User);
    const adminExists = await userRepo.findOneBy({ correo: 'admin@uah.cl' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = userRepo.create({
        nombreCompleto: 'Administrador Sistema',
        rut: '1-9',
        correo: 'admin@uah.cl',
        password: hashedPassword,
        rol: 'SuperUser'
      });
      await userRepo.save(admin);
      console.log("Admin inicial creado");
    }
  })
  .catch((err) => console.error("Error DB:", err));

const logAudit = async (nombre: string, usuario: string, rol: string, accion: string, detalle: string) => {
  try {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const log = auditRepo.create({ nombre, usuario, rol, accion, detalle });
    await auditRepo.save(log);
  } catch (error) {
    console.error("Error saving audit log:", error);
  }
};

// --- ENDPOINTS DE AUTENTICACION ---

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    const { correo, password } = req.body;
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

    // No enviar la contraseña al cliente
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
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

// Endpoints de Usuario (Ejemplo protegidos)
app.get('/api/users', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  const users = await AppDataSource.getRepository(User).find();
  res.json(users.map(u => {
    const { password, ...rest } = u;
    return rest;
  }));
});

app.get('/api/audit', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  const logs = await AppDataSource.getRepository(AuditLog).find({ order: { fecha: 'DESC' }, take: 1000 });
  res.json(logs);
});

app.post('/api/users', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
  }
});

// --- ENDPOINTS DE HORARIOS ---

app.get('/api/schedules', authMiddleware, async (req, res) => {
  const schedules = await AppDataSource.getRepository(Schedule).find();
  res.json(schedules);
});

app.post('/api/schedules', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const { lab, day, block, subject, color } = req.body;
    const scheduleRepo = AppDataSource.getRepository(Schedule);

    // Buscar si ya existe un bloque para ese lab, día y bloque
    let schedule = await scheduleRepo.findOneBy({ lab, day, block });

    if (schedule) {
      schedule.subject = subject;
      schedule.color = color;
    } else {
      schedule = scheduleRepo.create({ lab, day, block, subject, color });
    }

    await scheduleRepo.save(schedule);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar horario' });
  }
});

app.post('/api/schedules/bulk', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const schedulesData = req.body;
    if (!Array.isArray(schedulesData)) {
      return res.status(400).json({ message: 'Datos deben ser un array' });
    }

    const scheduleRepo = AppDataSource.getRepository(Schedule);
    
    // Para simplificar la lógica de "upsert" por (lab, day, block), lo haremos secuencial o usaremos save([])
    // save() con entidades que tienen Primary Column se actualizan, pero aquí la llave natural es (lab, day, block)
    // Para no complicar con llaves compuestas en TypeORM ahora, buscaremos y actualizaremos.
    
    const results = [];
    for (const s of schedulesData) {
      const { lab, day, block, subject, color } = s;
      let schedule = await scheduleRepo.findOneBy({ lab, day, block });
      if (schedule) {
        schedule.subject = subject;
        schedule.color = color;
      } else {
        schedule = scheduleRepo.create({ lab, day, block, subject, color });
      }
      results.push(await scheduleRepo.save(schedule));
    }

    res.status(201).json({ message: `${results.length} bloques procesados`, count: results.length });
  } catch (error) {
    console.error("Error en carga masiva de horarios:", error);
    res.status(500).json({ message: 'Error interno en carga masiva' });
  }
});

app.delete('/api/schedules/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
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

app.post('/api/inventory', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const newItem = itemRepo.create(req.body);
    const savedItem = await itemRepo.save(newItem) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_CREATE', `Item creado: ${savedItem.marca} ${savedItem.modelo} (${savedItem.rotulo_ID || 'Sin rotulo'})`);
    res.status(201).json(savedItem);
  } catch (error: any) {
    console.error("ERROR AL CREAR ITEM INDIVIDUAL:", error.message);
    if (error.detail) console.error("DETALLE DB:", error.detail);
    res.status(400).json({ message: 'Error al crear item', error: error.message });
  }
});

app.post('/api/inventory/bulk', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
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
        // Asegurar campos mínimos
        if (!data.tipoInventario) data.tipoInventario = 'Materiales';
        if (!data.status) data.status = 'Disponible';
        
        const newItem = itemRepo.create(data);
        const saved = await itemRepo.save(newItem);
        created.push(saved);
      } catch (err: any) {
        console.error("FALLO ITEM INDIVIDUAL:", data.marca, data.modelo);
        console.error("ERROR:", err.message);
        errors.push({ item: `${data.marca} ${data.modelo}`, error: err.message });
      }
    }

    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_BULK', `Carga masiva: ${created.length} creados, ${errors.length} fallidos`);
    
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

app.put('/api/inventory/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const item = await itemRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });
    Object.assign(item, req.body);
    const updated = await itemRepo.save(item) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_UPDATE', `Item actualizado: ${updated.marca} ${updated.modelo} - ${updated.status}`);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar item' });
  }
});

app.delete('/api/inventory/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    await AppDataSource.getRepository(InventoryItem).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar item' });
  }
});

// Endpoint para vaciar TODO el inventario
app.delete('/api/inventory/mass/clear', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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

app.put('/api/procurement/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  const tasks = await AppDataSource.getRepository(AdminTask).find({ order: { createdAt: 'DESC' } });
  res.json(tasks);
});

app.post('/api/admin-tasks', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    await AppDataSource.getRepository(AdminTask).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar tarea' });
  }
});

// --- ENDPOINTS DE MANTENCIÓN ---

app.get('/api/maintenance', authMiddleware, async (req: any, res) => {
  const tasks = await AppDataSource.getRepository(MaintenanceTask).find({ order: { dateScheduled: 'DESC' } });
  res.json(tasks);
});

app.post('/api/maintenance', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  const repo = AppDataSource.getRepository(Project);
  const projects = await repo.find({ relations: ['tasks'] });
  res.json(projects);
});

app.post('/api/projects', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const repo = AppDataSource.getRepository(Project);
    const p = await repo.findOne({ where: { id: parseInt(req.params.id) }, relations: ['tasks'] });
    if (!p) return res.status(404).json({ message: 'No encontrado' });
    Object.assign(p, req.body);
    await repo.save(p);
    res.json(p);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar proyecto' });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
  await AppDataSource.getRepository(Project).delete(req.params.id);
  res.status(204).send();
});

// --- ENDPOINTS DE WIKI/DOCUMENTACIÓN ---

app.get('/api/wiki', authMiddleware, async (req: any, res) => {
  const isAdmin = req.user.rol === 'SuperUser' || req.user.rol === 'Admin';
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
      if (role !== 'Admin' && role !== 'SuperUser') return;

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

// --- ENDPOINTS DE BITACORA ---

app.get('/api/bitacora', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
  const repo = AppDataSource.getRepository(Bitacora);
  const entries = await repo.find({ order: { id: 'DESC' } });
  res.json(entries);
});

app.post('/api/bitacora', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
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
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
  await AppDataSource.getRepository(Bitacora).delete(req.params.id);
  res.status(204).send();
});

app.delete('/api/schedules/lab/:lab', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') return res.status(403).json({ message: 'Acceso denegado' });
  try {
    const repo = AppDataSource.getRepository(Schedule);
    await repo.delete({ lab: req.params.lab });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar horarios del laboratorio' });
  }
});

// --- SERVIR FRONTEND ---
const publicPath = path.join(process.cwd(), 'dist/sga-fin/browser');
app.use(express.static(publicPath));

// Fallback para SPA (Cualquier ruta no manejada por API va al index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
