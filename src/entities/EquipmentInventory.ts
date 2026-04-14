import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity()
export class EquipmentInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'SGA_DEFAULT' })
  configName: string;

  @Column({ default: 0 })
  dellLaptops: number;

  @Column({ default: 0 })
  macLaptops: number;

  @Column({ default: 0 })
  dellChargers: number;

  @Column({ default: 0 })
  macChargers: number;

  @Column({ default: 0 })
  extensionCords: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
