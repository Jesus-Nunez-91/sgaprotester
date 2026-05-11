import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { PurchaseOrder } from '../../src/entities/PurchaseOrder';
import { ProcurementRequest } from '../../src/entities/ProcurementRequest';
import { logAudit } from '../utils/logger';

export const getProcurement = async (req: Request, res: Response) => {
  try {
    const orders = await AppDataSource.getRepository(PurchaseOrder).find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes de compra' });
  }
};

export const createProcurement = async (req: any, res: Response) => {
  try {
    const orderRepo = AppDataSource.getRepository(PurchaseOrder);
    const newOrder = orderRepo.create(req.body);
    await orderRepo.save(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear orden de compra' });
  }
};

export const getProcurementRequests = async (req: Request, res: Response) => {
  try {
    const requests = await AppDataSource.getRepository(ProcurementRequest).find();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
};

export const deleteProcurementRequest = async (req: any, res: Response) => {
  try {
    await AppDataSource.getRepository(ProcurementRequest).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar solicitud' });
  }
};

export const clearGhostRequests = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ProcurementRequest);
    const result = await repo.createQueryBuilder()
        .delete()
        .where("status = :status", { status: 'Pendiente' })
        .andWhere("(detalle LIKE :m1 OR detalle LIKE :m2 OR detalle LIKE :m3)", { m1: '%Carga masiva%', m2: '%Update%', m3: '%Actualización%' })
        .execute();
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'LOGS_PURGE', `Limpieza masiva de ${result.affected} registros fantasma`);
    res.json({ message: 'Limpieza completada', affected: result.affected });
  } catch (error) {
    res.status(500).json({ message: 'Error en purga masiva' });
  }
};
