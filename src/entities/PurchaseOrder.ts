import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class PurchaseOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lab: 'FABLAB' | 'QUIMICA' | 'FISICA' | 'INFORMATICA';

    @Column()
    item: string;

    @Column()
    cantidad: number;

    @Column('float')
    valorUnitario: number;

    @Column('float')
    valorTotal: number;

    @Column()
    fechaSolicitud: string;

    @Column({ default: 'Solicitud' })
    stage: 'Solicitud' | 'Adjudicacion' | 'Seguimiento' | 'Cierre';

    @Column({ nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;
}
