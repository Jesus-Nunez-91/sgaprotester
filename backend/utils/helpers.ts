import { AppDataSource } from '../data-source';
import { Notification } from '../../src/entities/Notification';
import { ProcurementRequest } from '../../src/entities/ProcurementRequest';
import { getIO } from '../socket';

export const normalizeStr = (str: string) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

export async function createNotification(userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') {
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
    
    const io = getIO();
    io.emit('notification:new', notif); 
  } catch (error) {
    console.error("Error al persistir notificación:", error);
  }
}

export async function logRequest(req: any, tipo: string, detalle: string, recId: number, horario: string = 'N/A', forceStatus?: string) {
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
