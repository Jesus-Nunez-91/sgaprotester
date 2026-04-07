import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string; // Puede ser un ID de usuario o 'all'

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: 'info' })
  type: string; // 'info', 'warning', 'success', 'error'

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
