import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    fecha: Date;

    @Column()
    nombre: string;

    @Column()
    usuario: string; // correo o rut

    @Column()
    rol: string;

    @Column()
    accion: string; // LOGIN, CREATE_USER, DELETE_ITEM, etc.

    @Column({ type: 'text' })
    detalle: string;
}
