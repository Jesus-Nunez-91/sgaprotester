import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from './User';
import { ProjectTask } from './ProjectTask';

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
    tasks_legacy: any[];

    @OneToMany(() => ProjectTask, (task) => task.project, { cascade: true })
    tasks: ProjectTask[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
