import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { DeviceType } from './device-type.entity';

@Entity('device_brands')
export class DeviceBrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'device_type_id', nullable: true })
  deviceTypeId: string;

  @ManyToOne(() => DeviceType, (type) => type.brands, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'device_type_id' })
  deviceType: DeviceType;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
