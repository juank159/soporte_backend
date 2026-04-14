import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceOrder } from './service-order.entity';

export enum EquipmentStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  REPAIRING = 'repairing',
  QUALITY_CHECK = 'quality_check',
  READY = 'ready',
  RETURNED = 'returned',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
}

@Entity('order_equipments')
export class OrderEquipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => ServiceOrder, (order) => order.equipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ServiceOrder;

  @Column({ name: 'device_type', length: 100 })
  deviceType: string;

  @Column({ name: 'device_brand', length: 100 })
  deviceBrand: string;

  @Column({ name: 'device_model', length: 100 })
  deviceModel: string;

  @Column({ name: 'device_serial', length: 100, nullable: true })
  deviceSerial: string;

  @Column({ name: 'device_color', length: 50, nullable: true })
  deviceColor: string;

  @Column({ name: 'accessories', type: 'simple-array', nullable: true })
  accessories: string[];

  @Column({ name: 'problem_reported', type: 'text' })
  problemReported: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.RECEIVED,
  })
  status: EquipmentStatus;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'technician_id', nullable: true })
  technicianId: string;

  @Column({ name: 'labor_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  laborCost: number;

  @Column({ name: 'warranty_days', default: 0 })
  warrantyDays: number;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
