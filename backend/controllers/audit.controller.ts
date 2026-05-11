import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { AuditLog } from '../../src/entities/AuditLog';

export const getAuditLogs = async (req: any, res: Response) => {
  if (req.user.rol !== 'SuperUser') {
    return res.status(403).json({ message: 'Acceso denegado: Solo el SuperUser tiene acceso a la Caja Negra' });
  }
  try {
    const logs = await AppDataSource.getRepository(AuditLog).find({ order: { fecha: 'DESC' }, take: 1000 });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener logs de auditoría' });
  }
};
