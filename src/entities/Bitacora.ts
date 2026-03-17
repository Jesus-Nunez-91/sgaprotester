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
        enum: ['FABLAB', 'CIENCIAS_BASICAS', 'INFORMATICA'],
    })
    lab: 'FABLAB' | 'CIENCIAS_BASICAS' | 'INFORMATICA';

    @Column()
    section: string;

    @Column({
        type: 'enum',
        enum: ['Incidencia', 'Observacion', 'Mejora'],
        default: 'Incidencia'
    })
    type: 'Incidencia' | 'Observacion' | 'Mejora';

    @Column('text')
    description: string;

    @Column()
    adminName: string;

    @Column({ nullable: true })
    adminId: number;
}
