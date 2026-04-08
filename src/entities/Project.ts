import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column()
    startDate: string;

    @Column()
    endDate: string;

    @Column({ default: 'Planeacion' })
    status: 'Planeacion' | 'En Progreso' | 'Finalizado';

    @Column()
    color: string;

    @ManyToOne(() => User)
    manager: User;

    @Column()
    managerId: number;

    @Column('jsonb', { default: [] })
    tasks: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
