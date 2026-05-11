import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source'; 
import { User } from '../../src/entities/User';
import { logAudit } from '../utils/logger';

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password, recaptchaToken } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Aquí iría la validación de reCAPTCHA si está activa

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
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    await logAudit(user.nombreCompleto, user.correo, user.rol, 'LOGIN_SUCCESS', 'Inicio de sesión exitoso');

    const { password: _, ...userWithoutPassword } = user;
    
    const cookieOptions = {
        httpOnly: true,
        secure: false, // Desactivado para compatibilidad con red interna UAH (sin SSL)
        sameSite: 'lax' as const,
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
    };
    
    res.cookie('token', token, cookieOptions);
    res.json({ message: 'Login exitoso', user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
