"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const data_source_1 = require("./data-source");
const Ticket_1 = require("../src/entities/Ticket");
const Message_1 = require("../src/entities/Message");
const User_1 = require("../src/entities/User");
const Schedule_1 = require("../src/entities/Schedule");
const InventoryItem_1 = require("../src/entities/InventoryItem");
const Reservation_1 = require("../src/entities/Reservation");
const AdminTask_1 = require("../src/entities/AdminTask");
const MaintenanceTask_1 = require("../src/entities/MaintenanceTask");
const PurchaseOrder_1 = require("../src/entities/PurchaseOrder");
const AuditLog_1 = require("../src/entities/AuditLog");
const Project_1 = require("../src/entities/Project");
const WikiDoc_1 = require("../src/entities/WikiDoc");
const Bitacora_1 = require("../src/entities/Bitacora");
const Room_1 = require("../src/entities/Room");
const RoomBlock_1 = require("../src/entities/RoomBlock");
const RoomReservation_1 = require("../src/entities/RoomReservation");
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Rate limiting for auth routes
const authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { message: 'Demasiados intentos de acceso. Por favor, intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use(express_1.default.json({ limit: '10mb' }));
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : "*"
    }
});
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'uah_secret_fallback';
// Inicializar DB y Admin
data_source_1.AppDataSource.initialize()
    .then(async () => {
    console.log("DB Conectada");
    // Migrar datos antiguos de 'Arduinos' a 'Materiales' para mantener compatibilidad
    const invRepo = data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
    try {
        const result = await invRepo.update({ tipoInventario: 'Arduinos' }, { tipoInventario: 'Materiales' });
        if (result.affected && result.affected > 0) {
            console.log(`Migración exitosa: ${result.affected} items actualizados de 'Arduinos' a 'Materiales'.`);
        }
    }
    catch (e) {
        console.error("Error durante la migración de datos de inventario:", e);
    }
    // Crear admin inicial si no existe
    const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
    const adminExists = await userRepo.findOneBy({ correo: 'admin@uah.cl' });
    if (!adminExists) {
        const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
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
    // --- SEED DE SALAS Y LABS ---
    try {
        const roomRepo = data_source_1.AppDataSource.getRepository(Room_1.Room);
        const count = await roomRepo.count();
        if (count === 0) {
            console.log('🌱 Sembrando salas iniciales (Labs)...');
            const defaultRooms = [
                { nombre: 'FABLAB', tipo: 'Laboratorio', capacidadMaxima: 20, ubicacionPiso: '1er Piso' },
                { nombre: 'QUIMICA', tipo: 'Laboratorio de Ciencias', capacidadMaxima: 15, ubicacionPiso: '2do Piso' },
                { nombre: 'FISICA', tipo: 'Laboratorio de Ciencias', capacidadMaxima: 15, ubicacionPiso: '2do Piso' },
                { nombre: 'HACKERLAB', tipo: 'Laboratorio de Computación', capacidadMaxima: 25, ubicacionPiso: '3er Piso' },
                { nombre: 'DESARROLLO TECNOLÓGICO', tipo: 'Laboratorio', capacidadMaxima: 20, ubicacionPiso: '3er Piso' },
                { nombre: 'SALA DE REUNIONES', tipo: 'Sala de Reuniones', capacidadMaxima: 8, ubicacionPiso: '1er Piso' }
            ];
            const blockRepo = data_source_1.AppDataSource.getRepository(RoomBlock_1.RoomBlock);
            const defaultBlocks = [
                { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
                { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
                { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
                { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
                { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
                { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
                { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
            ];
            for (const dr of defaultRooms) {
                const savedRoom = await roomRepo.save(roomRepo.create(dr));
                for (const b of defaultBlocks) {
                    await blockRepo.save(blockRepo.create({
                        roomId: savedRoom.id,
                        nombreBloque: b.nombre,
                        horaInicio: b.inicio,
                        horaFin: b.fin
                    }));
                }
            }
            console.log('✅ Sembrado de salas completado.');
        }
    }
    catch (e) {
        console.error('Error seeding rooms:', e);
    }
})
    .catch((err) => console.error("Error DB:", err));
const logAudit = async (nombre, usuario, rol, accion, detalle) => {
    try {
        const auditRepo = data_source_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
        const log = auditRepo.create({ nombre, usuario, rol, accion, detalle });
        await auditRepo.save(log);
    }
    catch (error) {
        console.error("Error saving audit log:", error);
    }
};
// --- ENDPOINTS DE AUTENTICACION ---
app.post('/api/auth/login', authRateLimit, async (req, res) => {
    try {
        const { correo, password } = req.body;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ correo });
        if (!user) {
            await logAudit('Sistema', correo || 'N/A', 'N/A', 'LOGIN_FAIL', 'Intento de login fallido: Correo no encontrado');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            await logAudit(user.nombreCompleto, user.correo, user.rol, 'LOGIN_FAIL', 'Intento de login fallido: Password incorrecta');
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, rol: user.rol, nombre: user.nombreCompleto, correo: user.correo }, JWT_SECRET, { expiresIn: '8h' });
        await logAudit(user.nombreCompleto, user.correo, user.rol, 'LOGIN_SUCCESS', 'Inicio de sesión exitoso');
        // No enviar la contraseña al cliente
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
app.post('/api/auth/register', authRateLimit, async (req, res) => {
    try {
        const { nombreCompleto, email, rut, carrera, anio, rol, pass } = req.body;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        // Verificar si ya existe
        const existing = await userRepo.findOneBy({ correo: email });
        if (existing) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(pass, 10);
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
    }
    catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});
// Middleware para proteger rutas
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'No autorizado' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Token inválido' });
    }
};
// Endpoints de Usuario (Ejemplo protegidos)
app.get('/api/users', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    const users = await data_source_1.AppDataSource.getRepository(User_1.User).find();
    res.json(users.map(u => {
        const { password, ...rest } = u;
        return rest;
    }));
});
app.get('/api/audit', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    const logs = await data_source_1.AppDataSource.getRepository(AuditLog_1.AuditLog).find({ order: { fecha: 'DESC' }, take: 1000 });
    res.json(logs);
});
app.post('/api/users', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const { password, ...userData } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password || 'uah123', 10);
        const newUser = userRepo.create({ ...userData, password: hashedPassword });
        const savedUser = await userRepo.save(newUser);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CREATE_USER', `Usuario creado: ${savedUser.nombreCompleto} (${savedUser.rol})`);
        const { password: _, ...result } = savedUser;
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear usuario' });
    }
});
app.post('/api/users/bulk', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const usersData = req.body;
        if (!Array.isArray(usersData)) {
            return res.status(400).json({ message: 'Datos deben ser un array' });
        }
        const defaultPassword = await bcryptjs_1.default.hash('uah123', 10);
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
    }
    catch (error) {
        console.error("Error bulk users:", error);
        res.status(500).json({ message: 'Error interno al procesar carga masiva' });
    }
});
app.put('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!user)
            return res.status(404).json({ message: 'Usuario no encontrado' });
        const { password, ...updateData } = req.body;
        if (password) {
            user.password = await bcryptjs_1.default.hash(password, 10);
        }
        Object.assign(user, updateData);
        const updatedUser = await userRepo.save(user);
        const { password: _, ...result } = updatedUser;
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar usuario' });
    }
});
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        await userRepo.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
    }
});
// --- ENDPOINTS DE HORARIOS ---
app.get('/api/schedules', authMiddleware, async (req, res) => {
    const schedules = await data_source_1.AppDataSource.getRepository(Schedule_1.Schedule).find();
    res.json(schedules);
});
app.post('/api/schedules', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const { lab, day, block, subject, color } = req.body;
        const scheduleRepo = data_source_1.AppDataSource.getRepository(Schedule_1.Schedule);
        // Buscar si ya existe un bloque para ese lab, día y bloque
        let schedule = await scheduleRepo.findOneBy({ lab, day, block });
        if (schedule) {
            schedule.subject = subject;
            schedule.color = color;
        }
        else {
            schedule = scheduleRepo.create({ lab, day, block, subject, color });
        }
        await scheduleRepo.save(schedule);
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al actualizar horario' });
    }
});
app.post('/api/schedules/bulk', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const schedulesData = req.body;
        if (!Array.isArray(schedulesData)) {
            return res.status(400).json({ message: 'Datos deben ser un array' });
        }
        const scheduleRepo = data_source_1.AppDataSource.getRepository(Schedule_1.Schedule);
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
            }
            else {
                schedule = scheduleRepo.create({ lab, day, block, subject, color });
            }
            results.push(await scheduleRepo.save(schedule));
        }
        res.status(201).json({ message: `${results.length} bloques procesados`, count: results.length });
    }
    catch (error) {
        console.error("Error en carga masiva de horarios:", error);
        res.status(500).json({ message: 'Error interno en carga masiva' });
    }
});
app.delete('/api/schedules/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin' && !req.user.rol?.includes('Acad')) {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        await data_source_1.AppDataSource.getRepository(Schedule_1.Schedule).delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar horario' });
    }
});
// --- ENDPOINTS DE INVENTARIO ---
app.get('/api/inventory', authMiddleware, async (req, res) => {
    const items = await data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem).find();
    res.json(items);
});
app.post('/api/inventory', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const itemRepo = data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const newItem = itemRepo.create(req.body);
        const savedItem = await itemRepo.save(newItem);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_CREATE', `Item creado: ${savedItem.marca} ${savedItem.modelo} (${savedItem.rotulo_ID || 'Sin rotulo'})`);
        res.status(201).json(savedItem);
    }
    catch (error) {
        console.error("ERROR AL CREAR ITEM INDIVIDUAL:", error.message);
        if (error.detail)
            console.error("DETALLE DB:", error.detail);
        res.status(400).json({ message: 'Error al crear item', error: error.message });
    }
});
app.post('/api/inventory/bulk', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const itemRepo = data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
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
                if (!data.tipoInventario)
                    data.tipoInventario = 'Materiales';
                if (!data.status)
                    data.status = 'Disponible';
                const newItem = itemRepo.create(data);
                const saved = await itemRepo.save(newItem);
                created.push(saved);
            }
            catch (err) {
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
    }
    catch (error) {
        console.error("ERROR CRÍTICO EN CARGA MASIVA:", error.message);
        res.status(500).json({ message: 'Error interno en carga masiva', error: error.message });
    }
});
app.put('/api/inventory/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const itemRepo = data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        const item = await itemRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!item)
            return res.status(404).json({ message: 'Item no encontrado' });
        Object.assign(item, req.body);
        const updated = await itemRepo.save(item);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_UPDATE', `Item actualizado: ${updated.marca} ${updated.modelo} - ${updated.status}`);
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar item' });
    }
});
app.delete('/api/inventory/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        await data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem).delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar item' });
    }
});
// Endpoint para vaciar TODO el inventario
app.delete('/api/inventory/mass/clear', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const itemRepo = data_source_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        await itemRepo.clear(); // Esto vacía la tabla por completo
        res.status(204).send();
    }
    catch (error) {
        console.error("Error clearing inventory:", error);
        res.status(500).json({ message: 'Error al vaciar el inventario' });
    }
});
// --- ENDPOINTS DE RESERVAS ---
app.get('/api/reservations', authMiddleware, async (req, res) => {
    const reservations = await data_source_1.AppDataSource.getRepository(Reservation_1.Reservation).find();
    res.json(reservations);
});
app.post('/api/reservations', authMiddleware, async (req, res) => {
    try {
        const resRepo = data_source_1.AppDataSource.getRepository(Reservation_1.Reservation);
        const newRes = resRepo.create(req.body);
        const savedRes = await resRepo.save(newRes);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_CREATE', `Reserva creada: ${savedRes.bloque} - ${savedRes.fecha}`);
        res.status(201).json(savedRes);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear reserva' });
    }
});
app.put('/api/reservations/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const resRepo = data_source_1.AppDataSource.getRepository(Reservation_1.Reservation);
        const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
        if (!reservation)
            return res.status(404).json({ message: 'Reserva no encontrada' });
        Object.assign(reservation, req.body);
        const updated = await resRepo.save(reservation);
        // Si se aprueba, loguear
        if (req.body.aprobada && !reservation.aprobada) {
            await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_APPROVE', `Reserva aprobada: ID ${updated.id} para ${updated.nombreSolicitante}`);
        }
        res.json(updated);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar reserva' });
    }
});
app.post('/api/reservations/:id/check-in', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const resRepo = data_source_1.AppDataSource.getRepository(Reservation_1.Reservation);
        const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
        if (!reservation)
            return res.status(404).json({ message: 'Reserva no encontrada' });
        reservation.clockIn = new Date();
        await resRepo.save(reservation);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_IN', `Ingreso registrado: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
        res.json(reservation);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en check-in' });
    }
});
app.post('/api/reservations/:id/check-out', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const resRepo = data_source_1.AppDataSource.getRepository(Reservation_1.Reservation);
        const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
        if (!reservation)
            return res.status(404).json({ message: 'Reserva no encontrada' });
        reservation.clockOut = new Date();
        await resRepo.save(reservation);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_OUT', `Salida registrada: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
        res.json(reservation);
    }
    catch (error) {
        res.status(500).json({ message: 'Error en check-out' });
    }
});
// --- ENDPOINTS DE COMPRAS (PURCHASE ORDERS) ---
app.get('/api/procurement', authMiddleware, async (req, res) => {
    const orders = await data_source_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder).find();
    res.json(orders);
});
app.post('/api/procurement', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const orderRepo = data_source_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        const newOrder = orderRepo.create(req.body);
        await orderRepo.save(newOrder);
        res.status(201).json(newOrder);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear orden de compra' });
    }
});
app.put('/api/procurement/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const orderRepo = data_source_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder);
        const order = await orderRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!order)
            return res.status(404).json({ message: 'Orden no encontrada' });
        Object.assign(order, req.body);
        await orderRepo.save(order);
        res.json(order);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar orden' });
    }
});
app.delete('/api/procurement/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        await data_source_1.AppDataSource.getRepository(PurchaseOrder_1.PurchaseOrder).delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar orden' });
    }
});
// --- ENDPOINTS DE TAREAS ADMIN (TO-DO) ---
app.get('/api/admin-tasks', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    const tasks = await data_source_1.AppDataSource.getRepository(AdminTask_1.AdminTask).find({ order: { createdAt: 'DESC' } });
    res.json(tasks);
});
app.post('/api/admin-tasks', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const taskRepo = data_source_1.AppDataSource.getRepository(AdminTask_1.AdminTask);
        const newTask = taskRepo.create(req.body);
        await taskRepo.save(newTask);
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear tarea' });
    }
});
app.put('/api/admin-tasks/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const taskRepo = data_source_1.AppDataSource.getRepository(AdminTask_1.AdminTask);
        const task = await taskRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!task)
            return res.status(404).json({ message: 'Tarea no encontrada' });
        Object.assign(task, req.body);
        await taskRepo.save(task);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar tarea' });
    }
});
app.delete('/api/admin-tasks/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        await data_source_1.AppDataSource.getRepository(AdminTask_1.AdminTask).delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar tarea' });
    }
});
// --- ENDPOINTS DE MANTENCIÓN ---
app.get('/api/maintenance', authMiddleware, async (req, res) => {
    const tasks = await data_source_1.AppDataSource.getRepository(MaintenanceTask_1.MaintenanceTask).find({ order: { dateScheduled: 'DESC' } });
    res.json(tasks);
});
app.post('/api/maintenance', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const maintRepo = data_source_1.AppDataSource.getRepository(MaintenanceTask_1.MaintenanceTask);
        const newTask = maintRepo.create(req.body);
        await maintRepo.save(newTask);
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear tarea de mantención' });
    }
});
app.put('/api/maintenance/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const maintRepo = data_source_1.AppDataSource.getRepository(MaintenanceTask_1.MaintenanceTask);
        const task = await maintRepo.findOneBy({ id: parseInt(req.params.id) });
        if (!task)
            return res.status(404).json({ message: 'Tarea no encontrada' });
        Object.assign(task, req.body);
        await maintRepo.save(task);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar tarea de mantención' });
    }
});
app.delete('/api/maintenance/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        await data_source_1.AppDataSource.getRepository(MaintenanceTask_1.MaintenanceTask).delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar tarea de mantención' });
    }
});
// --- ENDPOINTS DE PROYECTOS ---
app.get('/api/projects', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    const repo = data_source_1.AppDataSource.getRepository(Project_1.Project);
    const projects = await repo.find({ relations: ['tasks'] });
    res.json(projects);
});
app.post('/api/projects', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Project_1.Project);
        const project = repo.create(req.body);
        await repo.save(project);
        res.status(201).json(project);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear proyecto' });
    }
});
app.put('/api/projects/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Project_1.Project);
        const p = await repo.findOne({ where: { id: parseInt(req.params.id) }, relations: ['tasks'] });
        if (!p)
            return res.status(404).json({ message: 'No encontrado' });
        Object.assign(p, req.body);
        await repo.save(p);
        res.json(p);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar proyecto' });
    }
});
app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    await data_source_1.AppDataSource.getRepository(Project_1.Project).delete(req.params.id);
    res.status(204).send();
});
// --- ENDPOINTS DE WIKI/DOCUMENTACIÓN ---
app.get('/api/wiki', authMiddleware, async (req, res) => {
    const isAdmin = req.user.rol === 'SuperUser' || req.user.rol === 'Admin';
    const repo = data_source_1.AppDataSource.getRepository(WikiDoc_1.WikiDoc);
    let docs;
    if (isAdmin) {
        docs = await repo.find({ order: { createdAt: 'DESC' } });
    }
    else {
        docs = await repo.find({
            where: { isPublic: true },
            order: { createdAt: 'DESC' }
        });
    }
    res.json(docs);
});
app.post('/api/wiki', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(WikiDoc_1.WikiDoc);
        const doc = repo.create(req.body);
        await repo.save(doc);
        res.status(201).json(doc);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear documento' });
    }
});
app.put('/api/wiki/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(WikiDoc_1.WikiDoc);
        const doc = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!doc)
            return res.status(404).json({ message: 'Documento no encontrado' });
        Object.assign(doc, req.body);
        await repo.save(doc);
        res.json(doc);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar documento' });
    }
});
app.delete('/api/wiki/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    await data_source_1.AppDataSource.getRepository(WikiDoc_1.WikiDoc).delete(req.params.id);
    res.status(204).send();
});
// --- LÓGICA DE SOCKETS (SOPORTE) ---
io.on('connection', async (socket) => {
    const ticketRepo = data_source_1.AppDataSource.getRepository(Ticket_1.Ticket);
    const msgRepo = data_source_1.AppDataSource.getRepository(Message_1.Message);
    // Unirse a salas según rol al conectar
    socket.on('join', (data) => {
        const { userId, role, name } = data;
        console.log(`Solicitud de entrada a sala: UserID=${userId}, Rol=${role}, Nombre=${name}`);
        socket.userName = name; // Guardar nombre en el socket
        socket.userRole = role;
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
                user = await data_source_1.AppDataSource.getRepository(User_1.User).findOneBy({ id: userId });
            }
            // Extraer email del texto si es un ticket de invitado (formato: "Email: ...")
            let userEmail = user?.correo || 'N/A';
            if (userEmail === 'N/A' && firstMsg.text.includes('Email:')) {
                const emailMatch = firstMsg.text.match(/Email:\s*([^\s\n\r]+)/);
                if (emailMatch)
                    userEmail = emailMatch[1];
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
            if (userId && userId !== 0)
                emitter.to(`user_${userId}`);
            emitter.emit('ticket:created', newTicket);
        }
        catch (error) {
            console.error("Error creating ticket:", error);
        }
    });
    // Enviar mensaje en ticket existente
    socket.on('message:send', async (data) => {
        try {
            const { ticketId, text, sender, role } = data;
            const ticket = await ticketRepo.findOneBy({ id: String(ticketId) });
            if (!ticket)
                return;
            const newMessage = msgRepo.create({
                ticketId: String(ticketId),
                text,
                sender,
                senderRole: role,
                timestamp: new Date().toISOString(),
                ticket: ticket
            });
            await msgRepo.save(newMessage);
            await logAudit(sender, 'N/A', role, 'SEND_MESSAGE', `Mensaje en ticket ${ticketId}: ${text.substring(0, 20)}...`);
            // Actualizar metadata del ticket
            ticket.lastMessage = text;
            ticket.lastUpdate = new Date().toISOString();
            await ticketRepo.save(ticket);
            const payload = {
                ...newMessage,
                ticketId: parseInt(ticketId) // Frontend espera número en message:received
            };
            // Emitir solo a los involucrados: Admins y el dueño del ticket
            console.log(`Emitiendo message:received a 'admins' y 'user_${ticket.userId}'`);
            io.to('admins').to(`user_${ticket.userId}`).emit('message:received', payload);
        }
        catch (error) {
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
                const adminName = socket.userName || 'Administrador';
                const logMsg = msgRepo.create({
                    ticketId: String(ticketId),
                    text: `[SISTEMA]: El ticket ha sido marcado como ${status === 'Open' ? 'ABIERTO' : status === 'In Progress' ? 'EN CURSO' : 'CERRADO'} por ${adminName}.`,
                    sender: 'Sistema',
                    senderRole: 'admin',
                    timestamp: new Date().toISOString(),
                    ticket: ticket
                });
                await msgRepo.save(logMsg);
                io.to('admins').to(`user_${ticket.userId}`).emit('message:received', {
                    ...logMsg,
                    ticketId: parseInt(ticketId),
                    newStatus: status
                });
            }
        }
        catch (error) {
            console.error("Error updating ticket status:", error);
        }
    });
    // Eliminar ticket (Solo Admins)
    socket.on('ticket:delete', async ({ ticketId }) => {
        try {
            const role = socket.userRole;
            if (role !== 'Admin' && role !== 'SuperUser')
                return;
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
        }
        catch (error) {
            console.error("Error deleting ticket:", error);
        }
    });
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});
// --- ENDPOINTS DE BITACORA ---
app.get('/api/bitacora', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    const repo = data_source_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
    const entries = await repo.find({ order: { id: 'DESC' } });
    res.json(entries);
});
app.post('/api/bitacora', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const entry = repo.create({
            ...req.body,
            adminName: req.user.nombre,
            adminId: req.user.id
        });
        const savedEntry = await repo.save(entry);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_ENTRY', `Nueva anotación: ${savedEntry.section} - ${savedEntry.type}`);
        res.status(201).json(savedEntry);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al crear entrada en bitácora' });
    }
});
app.put('/api/bitacora/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Bitacora_1.Bitacora);
        const entry = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!entry)
            return res.status(404).json({ message: 'Entrada no encontrada' });
        Object.assign(entry, req.body);
        await repo.save(entry);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_EDIT', `Anotación editada: ${entry.id}`);
        res.json(entry);
    }
    catch (error) {
        res.status(400).json({ message: 'Error al actualizar entrada en bitácora' });
    }
});
app.delete('/api/bitacora/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    await data_source_1.AppDataSource.getRepository(Bitacora_1.Bitacora).delete(req.params.id);
    res.status(204).send();
});
app.delete('/api/schedules/lab/:lab', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Schedule_1.Schedule);
        await repo.delete({ lab: req.params.lab });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar horarios del laboratorio' });
    }
});
// --- ENDPOINTS DE SALAS Y RESERVAS (ROOMS) ---
app.get('/api/rooms', authMiddleware, async (req, res) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(Room_1.Room);
        const rooms = await repo.find({ order: { nombre: 'ASC' } });
        console.log(`[GET /api/rooms] Retornando ${rooms.length} salas`);
        res.json(rooms);
    }
    catch (e) {
        console.error('[GET /api/rooms] Error:', e);
        res.status(500).json({ message: 'Error al obtener salas' });
    }
});
app.post('/api/rooms', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Room_1.Room);
        const room = repo.create(req.body);
        const savedRoom = await repo.save(room);
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
        const blockRepo = data_source_1.AppDataSource.getRepository(RoomBlock_1.RoomBlock);
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
    }
    catch (e) {
        res.status(400).json({ message: 'Error al crear sala' });
    }
});
app.put('/api/rooms/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(Room_1.Room);
        const room = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!room)
            return res.status(404).json({ message: 'Sala no encontrada' });
        Object.assign(room, req.body);
        await repo.save(room);
        res.json(room);
    }
    catch (e) {
        res.status(400).json({ message: 'Error al actualizar sala' });
    }
});
app.delete('/api/rooms/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        await data_source_1.AppDataSource.getRepository(RoomBlock_1.RoomBlock).delete({ roomId: parseInt(req.params.id) });
        await data_source_1.AppDataSource.getRepository(RoomReservation_1.RoomReservation).delete({ roomId: parseInt(req.params.id) });
        await data_source_1.AppDataSource.getRepository(Room_1.Room).delete(req.params.id);
        res.status(204).send();
    }
    catch (e) {
        res.status(500).json({ message: 'Error al eliminar sala' });
    }
});
// Bloques de la sala
app.get('/api/rooms/:id/blocks', authMiddleware, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(RoomBlock_1.RoomBlock);
    const blocks = await repo.find({ where: { roomId: parseInt(req.params.id) }, order: { horaInicio: 'ASC' } });
    res.json(blocks);
});
// Editar un bloque existente
app.put('/api/room-blocks/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(RoomBlock_1.RoomBlock);
        const block = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!block)
            return res.status(404).json({ message: 'Bloque no encontrado' });
        Object.assign(block, req.body);
        await repo.save(block);
        res.json(block);
    }
    catch (e) {
        res.status(400).json({ message: 'Error al modificar bloque' });
    }
});
// Reservas de salas
app.get('/api/room-reservations', authMiddleware, async (req, res) => {
    const repo = data_source_1.AppDataSource.getRepository(RoomReservation_1.RoomReservation);
    const filters = {};
    if (req.query.roomId)
        filters.roomId = parseInt(req.query.roomId);
    if (req.query.fecha)
        filters.fechaExacta = req.query.fecha;
    const reservations = await repo.find({ where: filters });
    res.json(reservations);
});
app.post('/api/room-reservations', authMiddleware, async (req, res) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(RoomReservation_1.RoomReservation);
        const { roomId, roomBlockId, fechaExacta } = req.body;
        // Evitar doble reserva
        const existing = await repo.findOne({
            where: [
                { roomId, roomBlockId, fechaExacta, estado: 'Aprobada' },
                { roomId, roomBlockId, fechaExacta, estado: 'Pendiente' }
            ]
        });
        if (existing) {
            return res.status(409).json({ message: 'Este bloque ya se encuentra reservado o en proceso de revisión.' });
        }
        const newRes = repo.create({
            ...req.body,
            userId: req.user.id
        });
        await repo.save(newRes);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RESERVE', `Solicitud Sala ${roomId} el ${fechaExacta}`);
        res.status(201).json(newRes);
    }
    catch (e) {
        res.status(400).json({ message: 'Error al crear solicitud de reserva' });
    }
});
app.put('/api/room-reservations/:id/status', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin')
        return res.status(403).json({ message: 'Acceso denegado' });
    try {
        const repo = data_source_1.AppDataSource.getRepository(RoomReservation_1.RoomReservation);
        const reserve = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!reserve)
            return res.status(404).json({ message: 'Reserva no encontrada' });
        reserve.estado = req.body.estado; // 'Aprobada' o 'Rechazada'
        if (req.body.motivoRechazo)
            reserve.motivoRechazo = req.body.motivoRechazo;
        await repo.save(reserve);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RES_STATUS', `Reserva ${reserve.id} cambió a ${reserve.estado}`);
        res.json(reserve);
    }
    catch (e) {
        res.status(400).json({ message: 'Error al actualizar estado de reserva' });
    }
});
// --- SERVIR FRONTEND ---
const publicPath = path_1.default.join(process.cwd(), 'dist/sga-fin/browser');
app.use(express_1.default.static(publicPath));
// Fallback para SPA (Cualquier ruta no manejada por API va al index.html)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
