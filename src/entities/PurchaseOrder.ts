import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class PurchaseOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    lab: 'FABLAB' | 'QUIMICA' | 'FISICA' | 'INFORMATICA';

    @Column({ nullable: true })
    solicitante: string;

    @Column()
    item: string;

    @Column()
    cantidad: number;

    @Column('float')
    valorUnitario: number;

    @Column('float')
    valorTotal: number;

    @Column('simple-json', { nullable: true })
    itemsArray: { description: string, quantity: number, unitPrice: number }[];

    @Column()
    fechaSolicitud: string;

    @Column({ default: 'Solicitud' })
    stage: 'Solicitud' | 'Adjudicacion' | 'Seguimiento' | 'Cierre';

    @Column({ nullable: true })
    observaciones: string;

    @Column({ nullable: true })
    idNum: string; // The user-facing ID (EJ: 7905102)

    @Column({ nullable: true })
    linkReferencia: string;

    @Column({ nullable: true })
    proveedor: string;

    @Column({ nullable: true })
    rutProveedor: string;

    @Column({ nullable: true })
    productoAdjudicado: string;

    @Column('float', { nullable: true })
    precioAdjudicado: number;

    @Column({ nullable: true })
    cantidadAdjudicada: number;

    @Column({ nullable: true })
    numeroOC: string;

    @Column({ nullable: true })
    numeroCotizacion: string;

    @Column({ nullable: true })
    numeroFactura: string;

    @Column({ nullable: true })
    fechaFactura: string;

    @Column({ nullable: true })
    fechaEntrega: string;

    @CreateDateColumn()
    createdAt: Date;
}
