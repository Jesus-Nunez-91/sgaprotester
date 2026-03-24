import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    tipo: string;

    @Column()
    capacidadMaxima: number;

    @Column()
    ubicacionPiso: string;

    @Column({ default: true })
    estadoActivo: boolean;
}
