import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum PrinterType {
  THERMAL_80 = 'thermal_80',
  NORMAL = 'normal',
}

export enum ConnectionType {
  USB = 'usb',
  BLUETOOTH = 'bluetooth',
  TCP_IP = 'tcp_ip',
}

@Entity('printers')
export class Printer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: PrinterType })
  type: PrinterType;

  @Column({ name: 'connection_type', type: 'enum', enum: ConnectionType })
  connectionType: ConnectionType;

  @Column({ length: 255, nullable: true })
  host: string;

  @Column({ type: 'int', nullable: true })
  port: number;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}
