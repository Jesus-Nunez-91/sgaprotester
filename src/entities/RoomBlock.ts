import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RoomBlock {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomId: number;

    @Column()
    nombreBloque: string;

    @Column()
    horaInicio: string;

    @Column()
    horaFin: string;
}
