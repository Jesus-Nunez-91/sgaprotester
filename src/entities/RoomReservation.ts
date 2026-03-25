import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class RoomReservation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomId: number;

    @Column()
    roomBlockId: number;

    @Column()
    fechaExacta: string;

    @Column()
    userId: number; // reference to User who made reservation

    @Column()
    motivo: string;

    @Column({ nullable: true })
    participantes: number;

    @Column({ nullable: true })
    observacionOpcional: string;

    @Column({ default: 'Pendiente' })
    estado: string; // 'Pendiente', 'Aprobada', 'Rechazada'

    @Column({ default: '#3b82f6', nullable: true })
    color: string;

    @Column({ nullable: true })
    motivoRechazo: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
