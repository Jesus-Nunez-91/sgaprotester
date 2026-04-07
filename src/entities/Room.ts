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

    @Column({ nullable: true })
    ubicacionPiso: string;

    @Column({ type: 'float', nullable: true })
    metrosCuadrados: number;

    @Column({ type: 'int', default: 0 })
    valorHora: number;

    @Column({ default: false })
    tieneAireAcondicionado: boolean;

    @Column({ default: false })
    tieneProyector: boolean;

    @Column({ default: false })
    tieneTelevisor: boolean;

    @Column({ default: false })
    tienePizarra: boolean;

    @Column({ default: false })
    tieneAudio: boolean;

    @Column({ default: false })
    tieneComputadores: boolean;

    @Column({ default: false })
    tieneMicrofono: boolean;

    @Column({ default: false })
    tieneNotebooks: boolean;

    @Column({ default: false })
    tienePizarraInteligente: boolean;

    @Column({ default: false })
    tieneLavadero: boolean;

    @Column({ default: false })
    tieneDucha: boolean;

    @Column({ default: false })
    tieneBano: boolean;

    @Column({ type: 'text', nullable: true })
    otrosEquipos: string;

    @Column({ default: true })
    estadoActivo: boolean;
}
