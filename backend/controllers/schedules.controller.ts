import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Schedule } from '../../src/entities/Schedule';
import { Room } from '../../src/entities/Room';
import { RoomBlock } from '../../src/entities/RoomBlock';
import { RoomReservation } from '../../src/entities/RoomReservation';
import { normalizeStr } from '../utils/helpers';

export const getSchedules = async (req: Request, res: Response) => {
    try {
        const schedules = await AppDataSource.getRepository(Schedule).find();
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ message: 'Error al cargar horarios' });
    }
};

export const upsertSchedule = async (req: any, res: Response) => {
  try {
    const { lab, day, block, subject, color } = req.body;
    const scheduleRepo = AppDataSource.getRepository(Schedule);
    const roomRepo = AppDataSource.getRepository(Room);

    const canonicalLab = lab.toUpperCase();
    const normalizedLab = normalizeStr(lab);
    
    const allRooms = await roomRepo.find();
    let room = allRooms.find((r: any) => normalizeStr(r.nombre) === normalizedLab);

    if (!room) {
      room = roomRepo.create({
        nombre: canonicalLab,
        tipo: lab.toUpperCase().includes('SALA') ? 'Sala de Reuniones' : 'Laboratorio',
        capacidadMaxima: 20,
        ubicacionPiso: 'Por definir'
      });
      const savedRoom: any = await roomRepo.save(room);
      
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
    }

    let schedule = await scheduleRepo.findOneBy({ lab: room.nombre, day, block });

    if (schedule) {
      schedule.subject = subject;
      schedule.color = color;
    } else {
      schedule = scheduleRepo.create({ lab: room.nombre, day, block, subject, color });
    }

    await scheduleRepo.save(schedule);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar horario' });
  }
};

export const bulkSchedules = async (req: any, res: Response) => {
  try {
    const schedulesData = req.body;
    const scheduleRepo = AppDataSource.getRepository(Schedule);
    const roomRepo = AppDataSource.getRepository(Room);
    const blockRepo = AppDataSource.getRepository(RoomBlock);
    
    const results = [];
    for (const s of schedulesData) {
      const { lab, day, block, subject, color } = s;

      const allRooms = await roomRepo.find();
      let room = allRooms.find(r => normalizeStr(r.nombre) === normalizeStr(lab));
        
      if (!room && lab !== 'HIDDEN') {
        room = await roomRepo.save(roomRepo.create({
          nombre: lab.toUpperCase(),
          tipo: 'Laboratorio',
          capacidadMaxima: 20,
          ubicacionPiso: 'Carga masiva'
        })) as any;
        const defaultBlocks = [
          { inicio: '08:30', fin: '09:50', nombre: 'Bloque 1' },
          { inicio: '10:00', fin: '11:20', nombre: 'Bloque 2' },
          { inicio: '11:30', fin: '12:50', nombre: 'Bloque 3' },
          { inicio: '13:00', fin: '14:20', nombre: 'Bloque 4' },
          { inicio: '14:30', fin: '15:50', nombre: 'Bloque 5' },
          { inicio: '16:00', fin: '17:20', nombre: 'Bloque 6' },
          { inicio: '17:30', fin: '18:50', nombre: 'Bloque 7' }
        ];
        for (const b of defaultBlocks) {
          await blockRepo.save(blockRepo.create({
            roomId: room!.id,
            nombreBloque: b.nombre,
            horaInicio: b.inicio,
            horaFin: b.fin
          }));
        }
      }

      const canonicalLab = lab.toUpperCase();
      let schedule = await scheduleRepo.findOneBy({ lab: canonicalLab, day, block });
      if (schedule) {
        schedule.subject = subject;
        schedule.color = color;
      } else {
        schedule = scheduleRepo.create({ lab: canonicalLab, day, block, subject, color });
      }
      results.push(await scheduleRepo.save(schedule));
    }

    res.status(201).json({ message: `${results.length} bloques procesados`, count: results.length });
  } catch (error) {
    res.status(500).json({ message: 'Error interno en carga masiva' });
  }
};

export const deleteSchedule = async (req: any, res: Response) => {
  try {
    await AppDataSource.getRepository(Schedule).delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar horario' });
  }
};

export const deleteLabSchedules = async (req: any, res: Response) => {
  try {
    const labName = req.params.lab;
    await AppDataSource.getRepository(Schedule).delete({ lab: labName });

    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOneBy({ nombre: labName });
    if (room) {
      await AppDataSource.getRepository(RoomBlock).delete({ roomId: room.id });
      await AppDataSource.getRepository(RoomReservation).delete({ roomId: room.id });
      await roomRepo.delete(room.id);
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar horarios del laboratorio' });
  }
};
