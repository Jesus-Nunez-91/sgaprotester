import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entidad que representa un usuario registrado en el sistema.
 * Almacena información de perfil y credenciales de acceso.
 */
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombreCompleto: string;

    @Column({ unique: true })
    rut: string;

    @Column({ unique: true })
    correo: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: ['Alumno', 'Docente', 'Admin_Acade', 'Admin_Labs', 'Acad_Labs', 'SuperUser'],
        default: 'Alumno'
    })
    rol: 'Alumno' | 'Docente' | 'Admin_Acade' | 'Admin_Labs' | 'Acad_Labs' | 'SuperUser';

    @Column({ nullable: true })
    carrera: string;

    @Column({ nullable: true })
    anioIngreso: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
