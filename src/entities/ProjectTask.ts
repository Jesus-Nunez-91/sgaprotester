import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity()
export class ProjectTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    startDate: string;

    @Column()
    endDate: string;

    @Column({ default: 0 })
    progress: number;

    @Column({
        type: 'enum',
        enum: ['En espera', 'En proceso', 'Pendiente de Aprobacion', 'Finalizada'],
        default: 'En espera'
    })
    status: 'En espera' | 'En proceso' | 'Pendiente de Aprobacion' | 'Finalizada';

    @ManyToOne('Project', (project: any) => project.tasks)
    project: Project;

    @Column()
    projectId: number;

    @ManyToOne(() => User)
    assignee: User;

    @Column({ nullable: true })
    assigneeId: number;
}
