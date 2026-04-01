import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ProcurementRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    usuario: string;

    @Column()
    correo: string;

    @Column()
    tipoItem: string; // 'SALA', 'NOTEBOOK', 'MATERIAL'

    @Column()
    detalle: string;

    @Column({ default: 'Pendiente' })
    status: string;

    @Column()
    fecha: string;
}
