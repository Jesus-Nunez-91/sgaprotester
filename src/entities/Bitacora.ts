import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Bitacora {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    date: Date;

    @Column({
        type: 'enum',
        enum: ['FABLAB', 'LAB CIENCIAS BASICAS', 'LAB INFORMATICA'],
        nullable: true
    })
    lab: 'FABLAB' | 'LAB CIENCIAS BASICAS' | 'LAB INFORMATICA';

    @Column({ nullable: true })
    section: string;

    @Column({
        type: 'enum',
        enum: ['Incidencia', 'Observacion', 'Mejora'],
        default: 'Incidencia',
        nullable: true
    })
    type: 'Incidencia' | 'Observacion' | 'Mejora';

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    adminName: string;

    @Column({ nullable: true })
    adminId: number;
}
