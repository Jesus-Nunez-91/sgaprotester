import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User } from '../../src/entities/User';
import { logAudit } from '../utils/logger';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await AppDataSource.getRepository(User).find();
    res.json(users.map(u => {
      const { password, ...rest } = u as any;
      return rest;
    }));
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { nombreCompleto, email, rut, carrera, anio, rol, pass } = req.body;
    const userRepo = AppDataSource.getRepository(User);
    
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
      permisos: { 'Horarios Academicos': 'Solo Vista' },
      password: hashedPassword
    });

    await userRepo.save(user);
    await logAudit(nombreCompleto, email, rol, 'REGISTER', 'Usuario registrado exitosamente');
    
    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

export const createUser = async (req: any, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const { password, permisos, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(password || 'uah123', 10);
    const newUser = userRepo.create({ ...userData, password: hashedPassword, permisos: permisos || { 'Horarios Academicos': 'Solo Vista' } });
    const savedUser: any = await userRepo.save(newUser);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CREATE_USER', `Usuario creado: ${savedUser.nombreCompleto} (${savedUser.rol})`);
    res.json(savedUser);
  } catch (e) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const bulkCreateUsers = async (req: any, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const usersData = req.body;
    const savedUsers = [];
    for (const data of usersData) {
      const { password, ...rest } = data;
      const hashedPassword = await bcrypt.hash(password || 'uah123', 10);
      const user = userRepo.create({ ...rest, password: hashedPassword });
      savedUsers.push(await userRepo.save(user));
    }
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BULK_CREATE_USERS', `Creados ${savedUsers.length} usuarios`);
    res.json(savedUsers);
  } catch (e) {
    res.status(500).json({ message: 'Error en carga masiva' });
  }
};

export const updateUser = async (req: any, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    
    const { password, ...updateData } = req.body;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    Object.assign(user, updateData);
    await userRepo.save(user);
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'UPDATE_USER', `Usuario actualizado: ${user.nombreCompleto}`);
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: Number(req.params.id) });
    if (user) {
      await userRepo.remove(user);
      await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'DELETE_USER', `Usuario eliminado: ${user.nombreCompleto}`);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
