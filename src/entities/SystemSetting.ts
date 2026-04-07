import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Entidad Global de Configuración (UAH).
 * Almacena variables críticas del sistema que deben persistir,
 * como presupuestos máximos, límites de préstamos y parámetros globales.
 */
@Entity()
export class SystemSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    key: string; // Ejemplo: 'BUDGET_FABLAB', 'IVA_PERCENT'

    @Column('text')
    value: string; // Valor serializado (string o JSON)

    @Column({ nullable: true })
    description: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
