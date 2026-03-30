import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceOrder } from './service-order.entity';

@Entity('order_photos')
export class OrderPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => ServiceOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ServiceOrder;

  @Column({ name: 'photo_url' })
  photoUrl: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'taken_at_stage', length: 50, default: 'reception' })
  takenAtStage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
