import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Ticket } from './Ticket';

/**
 * Entidad que representa un mensaje individual dentro de un ticket de soporte.
 */
@Entity()
export class Message {
  // Identificador único autogenerado para cada mensaje
  @PrimaryGeneratedColumn()
  id: number;

  // ID del ticket al que pertenece este mensaje (relación externa)
  @Column('bigint')
  ticketId: string;

  // Nombre de la persona que envía el mensaje
  @Column()
  sender: string;

  // Contenido textual del mensaje
  @Column('text')
  text: string;

  // Marca de tiempo del mensaje (formato string ISO o similar)
  @Column()
  timestamp: string;

  // Rol del remitente para diferenciar entre usuario y administrador
  @Column()
  senderRole: string; // 'user' | 'admin'

  // Fecha de creación automática en la base de datos
  @CreateDateColumn()
  createdAt: Date;

  // Relación muchos-a-uno con el ticket padre
  @ManyToOne(() => Ticket, (ticket: Ticket) => ticket.messages)
  ticket: Ticket;
}
