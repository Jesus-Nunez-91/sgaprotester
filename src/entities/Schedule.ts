import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Entidad que representa un bloque de horario para un laboratorio.
 */
@Entity()
export class Schedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lab: string; // FABLAB, HACKERLAB, DESARROLLO TECNOLOGICO

    @Column()
    day: string; // Lunes, Martes, etc.

    @Column()
    block: string; // 08:30 - 09:50, etc.

    @Column()
    subject: string; // Nombre de la asignatura o curso
}
