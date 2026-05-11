import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../data-source';
import { Ticket } from '../../src/entities/Ticket';
import { Message } from '../../src/entities/Message';
import { Notification } from '../../src/entities/Notification';

export const handleSocketEvents = (io: Server, socket: Socket) => {
  const user = (socket as any).user;
  if (user) {
      const { id: userId, rol: role, nombre: name } = user;
      (socket as any).userName = name;
      (socket as any).userRole = role;
      if (role === 'SuperUser' || role === 'Admin_Labs' || role === 'Admin_Acade' || role === 'Admin') {
        socket.join('admins');
      }
      if (userId) {
        socket.join(`user_${userId}`);
      }
  }

  const ticketRepo = AppDataSource.getRepository(Ticket);
  const msgRepo = AppDataSource.getRepository(Message);

  socket.on('join', (data) => {
    // Mantener compatibilidad con cliente antiguo si fuera necesario, aunque ya manejamos join por token
    const { userId, role, name } = data;
    (socket as any).userName = name; 
    (socket as any).userRole = role;
    if (role === 'Admin' || role === 'SuperUser') {
      socket.join('admins');
    }
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on('message:send', async ({ ticketId, text, sender, role }) => {
    try {
      const ticket = await ticketRepo.findOne({ where: { id: String(ticketId) } });
      if (!ticket) return;

      const newMessage = msgRepo.create({
        ticketId: String(ticketId), text, sender, senderRole: role, timestamp: new Date().toISOString(), ticket: ticket
      });
      await msgRepo.save(newMessage);

      ticket.lastUpdate = new Date().toISOString();
      await ticketRepo.save(ticket);

      const payload = { ...newMessage, ticketId: parseInt(ticketId as any) };
      io.to('admins').to(`user_${ticket.userId}`).emit('message:received', payload);

      const notifRepo = AppDataSource.getRepository(Notification);
      const isAdmin = ['SuperUser', 'Admin_Labs', 'Admin_Acade', 'Academico'].includes(role);
      await notifRepo.save(notifRepo.create({
        userId: isAdmin ? ticket.userId.toString() : 'all',
        title: 'Nuevo Mensaje Soporte',
        message: `${sender}: ${text.substring(0, 30)}...`,
        type: 'info'
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on('ticket:update_status', async ({ ticketId, status }) => {
    try {
      const ticket = await ticketRepo.findOneBy({ id: String(ticketId) });
      if (ticket) {
        ticket.status = status;
        await ticketRepo.save(ticket);

        const adminName = (socket as any).userName || 'Administrador';
        const logMsg = msgRepo.create({
          ticketId: String(ticketId),
          text: `[SISTEMA]: El ticket ha sido marcado como ${status} por ${adminName}.`,
          sender: 'Sistema', senderRole: 'admin', timestamp: new Date().toISOString(), ticket: ticket
        });
        await msgRepo.save(logMsg);

        io.to('admins').to(`user_${ticket.userId}`).emit('message:received', {
          ...logMsg, ticketId: parseInt(ticketId as any), newStatus: status
        });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  });

  socket.on('ticket:delete', async ({ ticketId }) => {
    try {
      const role = (socket as any).userRole;
      const isAdmin = ['SuperUser', 'Admin_Labs'].includes(role);
      if (!isAdmin) return;

      const ticket = await ticketRepo.findOne({ where: { id: String(ticketId) }, relations: ['messages'] });
      if (ticket) {
        if (ticket.messages) await msgRepo.remove(ticket.messages);
        await ticketRepo.remove(ticket);
        io.to('admins').to(`user_${ticket.userId}`).emit('ticket:deleted', { ticketId });
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
};
