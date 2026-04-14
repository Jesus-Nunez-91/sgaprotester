import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SpecialLoan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  applicantName: string;

  @Column()
  applicantRut: string;

  @Column()
  applicantType: string; // Alumno, Docente, etc.

  @Column()
  startDate: string;

  @Column()
  endDate: string;

  @Column()
  reason: string;

  @Column({ type: 'json' })
  equipment: {
    dellLaptops: number;
    macLaptops: number;
    dellChargers: number;
    macChargers: number;
    extensionCords: number;
  };

  @Column({ type: 'json' })
  detailedItems: any[]; // List of DetailedEquipmentItem

  // Campos adicionales para el Acta UAH
  @Column({ nullable: true })
  itemType: string; // Ej: Notebook

  @Column({ nullable: true })
  itemModel: string; // Ej: Macbook Pro

  @Column({ nullable: true })
  itemId: string; // Ej: 038

  @Column({ nullable: true })
  accessories: string; // Ej: Cargador MagSafe

  @Column({ nullable: true })
  deliveryCondition: string; // Ej: Operativo y en óptimas condiciones

  @Column({ nullable: true })
  respDeliveryName: string;

  @Column({ nullable: true })
  respDeliveryRole: string;

  @Column({ nullable: true })
  respDiffusionName: string;

  @Column({ nullable: true })
  respDiffusionRole: string;

  @Column({ nullable: true })
  respDiffusionRut: string;

  @Column({ default: 'active' })
  status: 'active' | 'returned';

  @Column()
  documentNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
