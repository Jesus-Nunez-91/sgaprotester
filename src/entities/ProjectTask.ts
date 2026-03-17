import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity()
export class ProjectTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    startDate: string;

    @Column()
    endDate: string;

    @Column({ default: 0 })
    progress: number;

    @ManyToOne('Project', (project: any) => project.tasks)
    project: Project;

    @Column()
    projectId: number;

    @ManyToOne(() => User)
    assignee: User;

    @Column({ nullable: true })
    assigneeId: number;
}
