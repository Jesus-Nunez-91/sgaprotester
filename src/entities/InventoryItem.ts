import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class InventoryItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tipoInventario: 'Equipos' | 'Arduinos';

    @Column({ nullable: true })
    rotulo_ID: string;

    @Column()
    categoria: string;

    @Column()
    subCategoria: string;

    @Column()
    marca: string;

    @Column()
    modelo: string;

    @Column({ nullable: true })
    sn: string;

    @Column()
    status: string;

    @Column({ nullable: true })
    so: string;

    @Column({ nullable: true })
    procesador: string;

    @Column({ nullable: true })
    ram: string;

    @Column({ nullable: true })
    rom: string;

    @Column({ type: 'text', nullable: true })
    softwareInstalado: string;

    @Column({ default: 0 })
    stockActual: number;

    @Column({ default: 0 })
    stockMinimo: number;

    @Column({ default: 0 })
    stockDefectuoso: number;

    @Column({ default: false })
    esFungible: boolean;

    @Column({ nullable: true })
    imagenUrl: string;

    @Column({ nullable: true })
    numeroFactura: string;

    @Column({ nullable: true })
    fechaLlegada: string;

    @Column({ default: 0 })
    cantidadLlegada: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
