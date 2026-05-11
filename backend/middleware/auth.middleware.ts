import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET no está configurado en .env");
}

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  // Primero intentamos leer de la cookie (recomendado para web)
  let token = req.cookies.token;
  
  // Si no hay cookie, intentamos leer del header Authorization (para compatibilidad/móvil)
  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) return res.status(401).json({ message: 'No autorizado: Token faltante' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const checkPermission = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: `Acceso denegado: El rol ${req.user?.rol || 'N/A'} no tiene permisos para esta acción.` 
      });
    }
    next();
  };
};

export const ROLES = {
  ADMIN_STUFF: ['SuperUser', 'Admin_Labs', 'Admin_Acade'],
  RESERVATION_USERS: ['SuperUser', 'Admin_Labs', 'Admin_Acade', 'Academico', 'Docente', 'Alumno'],
  ACADEMIC_EDIT: ['SuperUser', 'Admin_Labs', 'Admin_Acade'],
  SECURITY_ONLY: ['SuperUser']
};
