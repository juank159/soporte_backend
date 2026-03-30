import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceOrder } from './service-order.entity';

@Entity('order_history')
export class OrderHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => ServiceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ServiceOrder;

  @Column({ name: 'from_status', length: 50, nullable: true })
  fromStatus: string;

  @Column({ name: 'to_status', length: 50 })
  toStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'user_name', length: 255, nullable: true })
  userName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
