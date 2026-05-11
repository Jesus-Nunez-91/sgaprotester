import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { WikiDoc } from '../../src/entities/WikiDoc';
import { Bitacora } from '../../src/entities/Bitacora';
import { Notification } from '../../src/entities/Notification';
import { logAudit } from '../utils/logger';

export const getWiki = async (req: any, res: Response) => {
  const isAdmin = ['SuperUser', 'Admin_Labs', 'Admin_Acade'].includes(req.user.rol);
  const repo = AppDataSource.getRepository(WikiDoc);
  let docs;
  if (isAdmin) {
    docs = await repo.find({ order: { createdAt: 'DESC' } });
  } else {
    docs = await repo.find({ where: { isPublic: true }, order: { createdAt: 'DESC' } });
  }
  res.json(docs);
};

export const saveWiki = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(WikiDoc);
    const data = req.body;
    let doc;
    if (data.id) {
      doc = await repo.findOneBy({ id: Number(data.id) });
      if (doc) Object.assign(doc, data);
    }
    if (!doc) doc = repo.create(data);
    await repo.save(doc as any);
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: 'Error al guardar documento' });
  }
};

export const deleteWiki = async (req: Request, res: Response) => {
    await AppDataSource.getRepository(WikiDoc).delete(req.params.id);
    res.status(204).send();
};

export const getBitacora = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Bitacora);
  const entries = await repo.find({ order: { id: 'DESC' } });
  res.json(entries);
};

export const createBitacoraEntry = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Bitacora);
    const entry = repo.create({ ...req.body, adminName: req.user.nombre, adminId: req.user.id });
    const savedEntry = await repo.save(entry) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_ENTRY', `Nueva anotación: ${savedEntry.section} - ${savedEntry.type}`);
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: 'Error' });
  }
};

export const updateBitacoraEntry = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Bitacora);
    const entry = await repo.findOneBy({ id: parseInt(req.params.id) });
    if (!entry) return res.status(404).json({ message: 'No encontrado' });
    Object.assign(entry, req.body);
    await repo.save(entry);
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'BITACORA_EDIT', `Anotación editada: ${entry.id}`);
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: 'Error' });
  }
};

export const deleteBitacoraEntry = async (req: Request, res: Response) => {
  await AppDataSource.getRepository(Bitacora).delete(req.params.id);
  res.status(204).send();
};

export const getNotifications = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notifications = await repo.find({
      where: [{ userId: req.user.id.toString() }, { userId: 'all' }],
      order: { createdAt: 'DESC' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

export const createNotificationApi = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notif = repo.create({ ...req.body, createdAt: new Date() });
    await repo.save(notif);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    const notif = await repo.findOneBy({ id: parseInt(req.params.id as string) });
    if (notif) { notif.read = true; await repo.save(notif); }
    res.json({ message: 'Ok' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

export const markAllNotificationsRead = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    await repo.createQueryBuilder()
      .update(Notification).set({ read: true })
      .where("userId = :userId OR userId = 'all'", { userId: req.user.id.toString() })
      .execute();
    res.json({ message: 'Ok' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

export const deleteAllNotifications = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Notification);
    await repo.delete({ userId: req.user.id.toString() });
    res.status(204).send();
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};
