import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Message } from './Message';

/**
 * Entidad que representa un ticket de soporte en el sistema.
 */
@Entity()
export class Ticket {
  // Identificador único del ticket (generado como timestamp en el cliente)
  @PrimaryColumn('bigint')
  id: string;

  // ID del usuario que creó el ticket
  @Column()
  userId: number;

  // Nombre completo del usuario
  @Column()
  userName: string;

  // Correo electrónico del usuario
  @Column()
  userEmail: string;

  // Asunto o título del ticket
  @Column()
  subject: string;

  // Resumen del último mensaje enviado
  @Column({ nullable: true })
  lastMessage: string;

  // Fecha y hora del último mensaje
  @Column({ nullable: true })
  lastUpdate: string;

  // Estado actual del ticket (ej. 'Abierto', 'Pendiente', 'Respondido', 'Cerrado')
  @Column({ default: 'Open' })
  status: string;

  // Fecha de creación automática
  @CreateDateColumn()
  createdAt: Date;

  // Fecha de última actualización automática
  @UpdateDateColumn()
  updatedAt: Date;

  // Relación uno-a-muchos con los mensajes del ticket
  @OneToMany(() => Message, (message: Message) => message.ticket, { cascade: true })
  messages: Message[];
}
