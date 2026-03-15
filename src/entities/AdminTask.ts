import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AdminTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @Column({ default: 'pending' })
    status: 'pending' | 'done';

    @Column({ default: 'Media' })
    priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';

    @Column({ nullable: true })
    dueDate: string;

    @CreateDateColumn()
    createdAt: Date;
}
