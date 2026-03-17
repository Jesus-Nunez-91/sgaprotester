import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class WikiDoc {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        type: 'enum',
        enum: ['Protocolo', 'Manual', 'Guia'],
        default: 'Guia'
    })
    category: 'Protocolo' | 'Manual' | 'Guia';

    @Column('text')
    content: string;

    @Column({ nullable: true })
    fileUrl: string;

    @Column({ default: true })
    isPublic: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
