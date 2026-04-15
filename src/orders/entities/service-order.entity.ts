import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Device } from '../../devices/entities/device.entity';
import { OrderItem } from './order-item.entity';
import { OrderEquipment } from './order-equipment.entity';
import { Signature } from '../../signatures/entities/signature.entity';

export enum OrderStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  REPAIRING = 'repairing',
  QUALITY_CHECK = 'quality_check',
  READY = 'ready',
  RETURNED = 'returned',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
}

@Entity('service_orders')
export class ServiceOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'order_number', length: 50 })
  orderNumber: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ name: 'technician_id', nullable: true })
  technicianId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({ name: 'problem_reported', type: 'text' })
  problemReported: string;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'labor_cost', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  laborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  total: number;

  @Column({ name: 'warranty_days', default: 0 })
  warrantyDays: number;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string;

  @Column({ name: 'pdf_generated_at', nullable: true })
  pdfGeneratedAt: Date;

  @Column({ name: 'pdf_hash_sha256', nullable: true })
  pdfHashSha256: string;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @OneToMany(() => OrderEquipment, (eq) => eq.order, { cascade: true })
  equipments: OrderEquipment[];

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Signature, (sig) => sig.order)
  signatures: Signature[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
