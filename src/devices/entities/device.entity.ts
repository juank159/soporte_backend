import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 100 })
  type: string;

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column({ length: 100, nullable: true })
  serial: string;

  @Column({ length: 100, nullable: true })
  imei: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  accessories: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
