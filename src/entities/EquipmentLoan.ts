import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class EquipmentLoan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  className: string;

  @Column()
  professor: string;

  @Column()
  day: string; // Lunes, Martes, etc.

  @Column()
  timeBlock: string; // 08:30 - 09:50, etc.

  @Column({ type: 'json' })
  equipment: {
    dellLaptops: number;
    macLaptops: number;
    dellChargers: number;
    macChargers: number;
    extensionCords: number;
  };

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ default: 'blue' })
  colorTheme: 'blue' | 'pink' | 'yellow';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
