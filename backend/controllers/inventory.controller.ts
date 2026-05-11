import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { InventoryItem } from '../../src/entities/InventoryItem';
import { MaintenanceTask } from '../../src/entities/MaintenanceTask';
import { logAudit } from '../utils/logger';
import { logRequest, createNotification } from '../utils/helpers';
import { Not, In } from "typeorm";

export const getInventory = async (req: Request, res: Response) => {
  const items = await AppDataSource.getRepository(InventoryItem).find();
  res.json(items);
};

export const createInventoryItem = async (req: any, res: Response) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const { marca, modelo, rotulo_ID, sn } = req.body;

    if (sn || rotulo_ID) {
      const existing = await itemRepo.findOne({
        where: [
          ...(sn ? [{ sn }] : []),
          ...(rotulo_ID ? [{ rotulo_ID }] : [])
        ]
      });
      if (existing) {
        return res.status(400).json({ message: `Ya existe un ítem con el SN: ${sn} o Rótulo: ${rotulo_ID}` });
      }
    }

    const newItem = itemRepo.create(req.body);
    const savedItem = await itemRepo.save(newItem) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_CREATE', `Item creado: ${savedItem.marca} ${savedItem.modelo} (${savedItem.rotulo_ID || 'Sin rotulo'})`);
    await createNotification('all', 'Nuevo Ítem de Inventario', `${req.user.nombre} añadió ${savedItem.marca} ${savedItem.modelo}`, 'info');
    
    res.status(201).json(savedItem);
  } catch (error: any) {
    res.status(400).json({ message: 'Error al crear item', error: error.message });
  }
};

export const bulkInventory = async (req: any, res: Response) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const itemsData = req.body;
    const created = [];
    const errors = [];
    const snPlaceholders = ['MUEBLEMET.', 'MUEBLEMET', 'NA', 'N/A', 'SIN', 'S/N', '0', 'FABLAB', '-', '.', 'SIN SERIAL'];

    for (const data of itemsData) {
      try {
        if (!data.tipoInventario) data.tipoInventario = 'Materiales';
        if (!data.status) data.status = 'Disponible';
        
        const snClean = data.sn?.trim();
        const rotuloClean = data.rotulo_ID?.trim();
        let exists = null;

        if (rotuloClean && rotuloClean !== '') {
            exists = await itemRepo.findOne({ where: { rotulo_ID: rotuloClean } });
        } 
        if (!exists && snClean && snClean !== '' && !snPlaceholders.includes(snClean.toUpperCase())) {
            exists = await itemRepo.findOne({ where: { sn: snClean } });
        }

        if (exists) {
            exists.stockActual = (exists.stockActual || 0) + (data.stockActual || 1);
            const saved = await itemRepo.save(exists);
            await logRequest(req, 'MATERIAL', `Actualización Stock: ${saved.marca} ${saved.modelo} (Rot: ${saved.rotulo_ID})`, saved.id, 'N/A', 'Aprobado');
            created.push(saved);
            continue;
        }

        const newItem = itemRepo.create(data);
        const saved: any = await itemRepo.save(newItem);
        await logRequest(req, 'MATERIAL', `Carga masiva: ${saved.marca} ${saved.modelo} (Rot: ${saved.rotulo_ID})`, saved.id, 'N/A', 'Aprobado');
        created.push(saved);
      } catch (err: any) {
        errors.push({ item: `${data.marca} ${data.modelo}`, error: err.message });
      }
    }
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_BULK', `Carga masiva: ${created.length} creados, ${errors.length} fallidos`);
    if (created.length > 0) {
      await createNotification('all', 'Carga Masiva Inventario', `Se procesaron ${created.length} ítems exitosamente por ${req.user.nombre}`, 'success');
    }
    res.status(201).json({ count: created.length, errorCount: errors.length, errors: errors.slice(0, 10) });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno en carga masiva', error: error.message });
  }
};

export const updateInventoryItem = async (req: any, res: Response) => {
  try {
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    const item = await itemRepo.findOneBy({ id: parseInt(req.params.id) });
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });

    const oldStatus = item.status;
    const oldStockDef = item.stockDefectuoso || 0;
    Object.assign(item, req.body);
    const updated = await itemRepo.save(item) as any;

    if ( (['Defectuoso', 'En Mantención'].includes(updated.status) && !['Defectuoso', 'En Mantención'].includes(oldStatus)) || updated.stockDefectuoso > oldStockDef ) {
      const maintRepo = AppDataSource.getRepository(MaintenanceTask);
      const existingTask = await maintRepo.findOne({ where: { itemId: updated.id, status: Not(In(['Finalizado', 'Cancelado'] as any)) } });
      if (!existingTask) {
          await maintRepo.save(maintRepo.create({
              itemId: updated.id, itemName: `${updated.marca} ${updated.modelo}`, type: 'Correctivo', priority: 'Alta', status: 'Pendiente', technician: 'Por asignar', cost: 0,
              description: `Auto-generado: Equipo reportado como ${updated.status.toUpperCase()} (SN: ${updated.sn || 'S/N'}).`,
              dateScheduled: new Date().toISOString().split('T')[0]
          }));
      }
    }
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'INVENTORY_UPDATE', `Item actualizado: ${updated.marca} ${updated.modelo} - ${updated.status}`);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar item' });
  }
};

export const deleteInventoryItem = async (req: any, res: Response) => {
  try {
    await AppDataSource.getRepository(InventoryItem).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar item' });
  }
};

export const clearInventory = async (req: any, res: Response) => {
  try {
    await AppDataSource.getRepository(InventoryItem).clear();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al vaciar el inventario' });
  }
};
