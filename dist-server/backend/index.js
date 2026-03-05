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
const User_1 = require("../src/entities/User");
const Schedule_1 = require("../src/entities/Schedule");
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
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
})
    .catch((err) => console.error("Error DB:", err));
// --- ENDPOINTS DE AUTENTICACION ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ correo });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '8h' });
        // No enviar la contraseña al cliente
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
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
app.get('/api/schedules', async (req, res) => {
    const schedules = await data_source_1.AppDataSource.getRepository(Schedule_1.Schedule).find();
    res.json(schedules);
});
app.post('/api/schedules', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    try {
        const { lab, day, block, subject } = req.body;
        const scheduleRepo = data_source_1.AppDataSource.getRepository(Schedule_1.Schedule);
        // Buscar si ya existe un bloque para ese lab, día y bloque
        let schedule = await scheduleRepo.findOneBy({ lab, day, block });
        if (schedule) {
            schedule.subject = subject;
        }
        else {
            schedule = scheduleRepo.create({ lab, day, block, subject });
        }
        await scheduleRepo.save(schedule);
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al actualizar horario' });
    }
});
app.delete('/api/schedules/:id', authMiddleware, async (req, res) => {
    if (req.user.rol !== 'SuperUser' && req.user.rol !== 'Admin') {
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
// Servir archivos estáticos de Angular
const publicPath = path_1.default.join(process.cwd(), 'dist/sga-pro/browser');
app.use(express_1.default.static(publicPath));
app.get('/*', (req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});
