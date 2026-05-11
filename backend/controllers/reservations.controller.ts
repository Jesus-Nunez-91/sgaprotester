import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Reservation } from '../../src/entities/Reservation';
import { RoomReservation } from '../../src/entities/RoomReservation';
import { Room } from '../../src/entities/Room';
import { RoomBlock } from '../../src/entities/RoomBlock';
import { ProcurementRequest } from '../../src/entities/ProcurementRequest';
import { logAudit } from '../utils/logger';
import { logRequest, createNotification } from '../utils/helpers';
import { Not } from "typeorm";

export const getReservations = async (req: Request, res: Response) => {
  const reservations = await AppDataSource.getRepository(Reservation).find();
  res.json(reservations);
};

export const createReservation = async (req: any, res: Response) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const newRes = resRepo.create(req.body);
    const savedRes = await resRepo.save(newRes) as any;
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_CREATE', `Reserva creada: ${savedRes.bloque} - ${savedRes.fecha}`);
    res.status(201).json(savedRes);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear reserva' });
  }
};

export const updateReservation = async (req: any, res: Response) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    const wasAproved = reservation.aprobada;
    Object.assign(reservation, req.body);
    const updated = await resRepo.save(reservation) as any;
    
    if (req.body.aprobada && !wasAproved) {
       await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_APPROVE', `Reserva aprobada: ID ${updated.id} para ${updated.nombreSolicitante}`);
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar reserva' });
  }
};

export const deleteReservation = async (req: any, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const resRepo = AppDataSource.getRepository(Reservation);
        const logRepo = AppDataSource.getRepository(ProcurementRequest);

        await logRepo.delete({ recId: id, tipoItem: Not('SALA') as any });
        
        const result = await resRepo.delete(id);
        if (result.affected === 0) return res.status(404).json({ message: 'Reserva no encontrada' });

        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'RESERVATION_DELETE', `Reserva de laboratorio eliminada ID: ${id}`);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar reserva', detail: error.message });
    }
};

export const checkInReservation = async (req: any, res: Response) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    reservation.clockIn = new Date();
    await resRepo.save(reservation);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_IN', `Ingreso registrado: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error en check-in' });
  }
};

export const checkOutReservation = async (req: any, res: Response) => {
  try {
    const resRepo = AppDataSource.getRepository(Reservation);
    const reservation = await resRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    reservation.clockOut = new Date();
    await resRepo.save(reservation);
    
    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'CHECK_OUT', `Salida registrada: ${reservation.nombreSolicitante} - Reserva ID ${reservation.id}`);
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error en check-out' });
  }
};

export const createRoomReservation = async (req: any, res: Response) => {
  try {
    const resRepo = AppDataSource.getRepository(RoomReservation);
    const reservation = resRepo.create({
      ...req.body,
      userCorreo: req.user.correo,
      userName: req.user.nombre,
      userId: req.user.id,
      estado: req.user.rol.includes('Admin') ? 'Aprobada' : 'Pendiente'
    });
    const saved: any = await resRepo.save(reservation);
    
    const roomRepo = AppDataSource.getRepository(Room);
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    const room = await roomRepo.findOneBy({ id: saved.roomId });
    const block = await blockRepo.findOneBy({ id: saved.roomBlockId });
    
    const detalleFinal = `Reserva sala ${room?.nombre || 'Indefinida'} (${saved.fechaExacta})`;
    await logRequest(req, 'SALA', detalleFinal, saved.id, block?.nombreBloque || 'S/H');
    await createNotification('all', 'Nueva Reserva de Sala', `${req.user.nombre} reservó ${room?.nombre || 'Sala'} para el ${saved.fechaExacta}`, 'info');

    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoomReservation = async (req: any, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const resRepo = AppDataSource.getRepository(RoomReservation);
        const logRepo = AppDataSource.getRepository(ProcurementRequest);

        await logRepo.delete({ recId: id, tipoItem: 'SALA' });
        
        const result = await resRepo.delete(id);
        if (result.affected === 0) return res.status(404).json({ message: 'Reserva no encontrada' });

        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RES_DELETE', `Reserva de sala eliminada ID: ${id}`);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: 'Error al eliminar reserva de sala', detail: error.message });
    }
};
