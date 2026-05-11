import { AppDataSource } from '../data-source';
import { AuditLog } from '../../src/entities/AuditLog';

export const logAudit = async (nombre: string, usuario: string, rol: string, accion: string, detalle: string) => {
  try {
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const log = auditRepo.create({ nombre, usuario, rol, accion, detalle });
    await auditRepo.save(log);
  } catch (error) {
    console.error("Error saving audit log:", error);
  }
};
