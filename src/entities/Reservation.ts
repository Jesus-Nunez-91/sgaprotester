import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    equipoId: number;

    @Column()
    fecha: string;

    @Column()
    bloque: string;

    @Column()
    cantidad: number;

    @Column()
    nombreSolicitante: string;

    @Column()
    rutSolicitante: string;

    @Column()
    emailSolicitante: string;

    @Column()
    tipoUsuario: string;

    @Column({ nullable: true })
    userId: number;

    @Column({ default: false })
    aprobada: boolean;

    @Column({ default: false })
    rechazada: boolean;

    @Column({ nullable: true })
    motivoRechazo: string;

    @Column({ nullable: true })
    devuelto: number;

    @Column({ type: 'timestamp', nullable: true })
    clockIn: Date;

    @Column({ type: 'timestamp', nullable: true })
    clockOut: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
