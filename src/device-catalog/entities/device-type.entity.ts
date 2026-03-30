import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { DeviceBrand } from './device-brand.entity';

@Entity('device_types')
export class DeviceType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => DeviceBrand, (brand) => brand.deviceType)
  brands: DeviceBrand[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
