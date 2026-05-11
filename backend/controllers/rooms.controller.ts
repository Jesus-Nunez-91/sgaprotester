import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Room } from '../../src/entities/Room';
import { RoomBlock } from '../../src/entities/RoomBlock';
import { RoomReservation } from '../../src/entities/RoomReservation';
import { Schedule } from '../../src/entities/Schedule';
import { ProcurementRequest } from '../../src/entities/ProcurementRequest';
import { logAudit } from '../utils/logger';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Room);
    const rooms = await repo.find({ order: { nombre: 'ASC' } });
    res.json(rooms);
  } catch(e: any) {
    try {
        const rooms = await AppDataSource.query('SELECT * FROM "room" ORDER BY "nombre" ASC');
        const normalizedRooms = rooms.map((r: any) => ({
            ...r,
            metrosCuadrados: r.metrosCuadrados || 0,
            valorHora: r.valorHora || 0,
            tieneAireAcondicionado: !!r.tieneAireAcondicionado,
            tieneProyector: !!r.tieneProyector,
            tieneTelevisor: !!r.tieneTelevisor,
            tienePizarra: !!r.tienePizarra,
            tieneAudio: !!r.tieneAudio,
            tieneComputadores: !!r.tieneComputadores,
            tieneMicrofono: !!r.tieneMicrofono,
            tieneNotebooks: !!r.tieneNotebooks,
            tienePizarraInteligente: !!r.tienePizarraInteligente,
            tieneLavadero: !!r.tieneLavadero,
            tieneDucha: !!r.tieneDucha,
            tieneBano: !!r.tieneBano,
            otrosEquipos: r.otrosEquipos || '',
            estadoActivo: r.estadoActivo !== false
        }));
        res.json(normalizedRooms);
    } catch(fallbackErr: any) {
        res.status(500).json({ message: 'Error total en salas', error: fallbackErr.message });
    }
  }
};

export const createRoom = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Room);
    const room = repo.create(req.body);
    const savedRoom: any = await repo.save(room);

    const blocks = [
        { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
        { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
        { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
        { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
        { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
        { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
        { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
    ];
    
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    for (const b of blocks) {
        await blockRepo.save(blockRepo.create({
            roomId: savedRoom.id,
            nombreBloque: b.nombre,
            horaInicio: b.inicio,
            horaFin: b.fin
        }));
    }

    await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_CREATE', `Sala creada: ${savedRoom.nombre}`);
    res.status(201).json(savedRoom);
  } catch(e) {
    res.status(400).json({ message: 'Error al crear sala' });
  }
};

export const updateRoom = async (req: any, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Room);
    const room = await repo.findOneBy({ id: parseInt(req.params.id) });
    if (!room) return res.status(404).json({ message: 'Sala no encontrada' });
    Object.assign(room, req.body);
    await repo.save(room);
    res.json(room);
  } catch(e) {
    res.status(400).json({ message: 'Error al actualizar sala' });
  }
};

export const deleteRoom = async (req: any, res: Response) => {
  try {
    const roomId = parseInt(req.params.id);
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOneBy({ id: roomId });
    
    if (room) {
      try { await AppDataSource.getRepository(Schedule).delete({ lab: room.nombre }); } catch(e) {}
      try { await AppDataSource.getRepository(RoomReservation).delete({ roomId }); } catch(e) {}
      try { await AppDataSource.getRepository(RoomBlock).delete({ roomId }); } catch(e) {}

      await roomRepo.delete(roomId);
      await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_DELETE', `Sala eliminada: ${room.nombre}`);
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Sala no encontrada' });
    }
  } catch(e) {
    res.status(500).json({ message: 'Error interno al eliminar sala' });
  }
};

export const getRoomBlocks = async (req: Request, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RoomBlock);
        const blocks = await repo.find({ where: { roomId: parseInt(req.params.id as string) }, order: { horaInicio: 'ASC' } });
        res.json(blocks);
    } catch (e) {
        res.status(500).json({ message: 'Error al obtener bloques' });
    }
};

export const updateRoomBlock = async (req: any, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RoomBlock);
        const block = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!block) return res.status(404).json({ message: 'Bloque no encontrado' });
        Object.assign(block, req.body);
        await repo.save(block);
        res.json(block);
    } catch(e) {
        res.status(400).json({ message: 'Error al modificar bloque' });
    }
};

export const getRoomReservations = async (req: Request, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RoomReservation);
        const filters: any = {};
        if (req.query.roomId) filters.roomId = parseInt(req.query.roomId as string);
        if (req.query.fecha) filters.fechaExacta = req.query.fecha as string;
        
        const reservations = await repo.find({ where: filters });
        res.json(reservations);
    } catch(e: any) {
        try {
            const query = `SELECT * FROM "room_reservation" ${req.query.fecha ? `WHERE "fechaExacta" = '${req.query.fecha}'` : ''}`;
            const reservations = await AppDataSource.query(query);
            res.json(reservations.map((r: any) => ({
                ...r,
                color: r.color || '#3b82f6'
            })));
        } catch(fallbackErr: any) {
            res.status(500).json({ message: 'Error total en reservas', error: fallbackErr.message });
        }
    }
};

export const updateRoomReservationStatus = async (req: any, res: Response) => {
    try {
        const repo = AppDataSource.getRepository(RoomReservation);
        const reserve = await repo.findOneBy({ id: parseInt(req.params.id) });
        if (!reserve) return res.status(404).json({ message: 'Reserva no encontrada' });
        
        reserve.estado = req.body.estado;
        if (req.body.motivoRechazo) reserve.motivoRechazo = req.body.motivoRechazo;

        await repo.save(reserve);
        await logAudit(req.user.nombre, req.user.correo, req.user.rol, 'ROOM_RES_STATUS', `Reserva ${reserve.id} cambió a ${reserve.estado}`);

        const histRepo = AppDataSource.getRepository(ProcurementRequest);
        const historyEntry = await histRepo.findOne({ where: { recId: reserve.id, tipoItem: 'SALA' } });
        if (historyEntry) {
            historyEntry.status = reserve.estado;
            await histRepo.save(historyEntry);
        }

        res.json(reserve);
    } catch(e) {
        res.status(400).json({ message: 'Error al actualizar estado de reserva' });
    }
};
