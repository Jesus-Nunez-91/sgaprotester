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
import dotenv from "dotenv";
import helmet from "helmet";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);

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

// --- ENDPOINTS DE AUTENTICACION ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ correo });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // No enviar la contraseña al cliente
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
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

app.get('/api/schedules', async (req, res) => {
  const schedules = await AppDataSource.getRepository(Schedule).find();
  res.json(schedules);
});

app.post('/api/schedules', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  try {
    const { lab, day, block, subject } = req.body;
    const scheduleRepo = AppDataSource.getRepository(Schedule);

    // Buscar si ya existe un bloque para ese lab, día y bloque
    let schedule = await scheduleRepo.findOneBy({ lab, day, block });

    if (schedule) {
      schedule.subject = subject;
    } else {
      schedule = scheduleRepo.create({ lab, day, block, subject });
    }

    await scheduleRepo.save(schedule);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar horario' });
  }
});

app.delete('/api/schedules/:id', authMiddleware, async (req: any, res) => {
  if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
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

app.get('/api/inventory', async (req, res) => {
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
    await itemRepo.save(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear item' });
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

    console.log(`Intentando carga masiva de ${itemsData.length} items para ${itemsData[0]?.categoria} - ${itemsData[0]?.subCategoria}`);

    // Guardar todos los items. save() de TypeORM maneja arrays y genera IDs si faltan.
    const savedItems = await itemRepo.save(itemsData);
    console.log(`Carga masiva finalizada exitosamente. ${savedItems.length} items persistidos.`);

    res.status(201).json({
      message: 'Carga masiva exitosa',
      count: savedItems.length
    });
  } catch (error) {
    console.error("Error en carga masiva de inventario:", error);
    res.status(500).json({ message: 'Error interno en carga masiva' });
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
    await itemRepo.save(item);
    res.json(item);
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

// --- ENDPOINTS DE RESERVAS ---

app.get('/api/reservations', async (req, res) => {
  const reservations = await AppDataSource.getRepository(Reservation).find();
  res.json(reservations);
});

app.post('/api/reservations', authMiddleware, async (req: any, res) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const newRes = resRepo.create(req.body);
    await resRepo.save(newRes);
    res.status(201).json(newRes);
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
    const reservation = await resRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    Object.assign(reservation, req.body);
    await resRepo.save(reservation);
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar reserva' });
  }
});

// Servir archivos estáticos de Angular
const publicPath = path.join(process.cwd(), 'dist/sga-pro/browser');
app.use(express.static(publicPath));

app.get('/*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
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

      // Buscar email del usuario (opcional, si el frontend no lo envía)
      const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });

      const newTicket = ticketRepo.create({
        id: String(id),
        subject,
        userId,
        userName,
        userEmail: user?.correo || 'N/A',
        status: 'Open',
        lastMessage: firstMsg.text,
        lastUpdate: new Date().toISOString()
      });

      await ticketRepo.save(newTicket);

      const newMessage = msgRepo.create({
        ticketId: String(id),
        text: firstMsg.text,
        sender: firstMsg.sender,
        senderRole: firstMsg.role,
        timestamp: new Date().toISOString(),
        ticket: newTicket
      });

      await msgRepo.save(newMessage);

      // Añadir el mensaje al objeto ticket para la emisión
      newTicket.messages = [newMessage];

      // Notificar a administradores y al propio usuario
      console.log(`Emitiendo ticket:created a 'admins' y 'user_${userId}'`);
      io.to('admins').to(`user_${userId}`).emit('ticket:created', newTicket);
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
          text: `[SISTEMA]: El ticket ha sido marcado como ${status === 'Open' ? 'ABIERTO' : 'CERRADO'} por ${adminName}.`,
          sender: 'Sistema',
          senderRole: 'admin',
          timestamp: new Date().toISOString(),
          ticket: ticket
        });
        await msgRepo.save(logMsg);

        io.to('admins').to(`user_${ticket.userId}`).emit('message:received', {
          ...logMsg,
          ticketId: parseInt(ticketId as any)
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
