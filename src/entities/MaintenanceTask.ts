import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class MaintenanceTask {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    itemId: number;

    @Column()
    itemName: string;

    @Column()
    type: 'Preventivo' | 'Correctivo';

    @Column()
    priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';

    @Column()
    status: 'Pendiente' | 'En Progreso' | 'Finalizado';

    @Column()
    technician: string;

    @Column('float')
    cost: number;

    @Column('text')
    description: string;

    @Column()
    dateScheduled: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
