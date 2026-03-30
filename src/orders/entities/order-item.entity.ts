import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceOrder } from './service-order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => ServiceOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ServiceOrder;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'int', default: 1 })
  qty: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;
}
