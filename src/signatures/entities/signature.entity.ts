import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ServiceOrder } from '../../orders/entities/service-order.entity';

export enum SignerType {
  CUSTOMER = 'customer',
  TECHNICIAN = 'technician',
}

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => ServiceOrder, (order) => order.signatures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: ServiceOrder;

  @Column({ name: 'signer_type', type: 'enum', enum: SignerType })
  signerType: SignerType;

  @Column({ name: 'signer_name', length: 255 })
  signerName: string;

  @Column({ name: 'svg_path', type: 'text', nullable: true })
  svgPath: string;

  @Column({ name: 'png_url', type: 'text', nullable: true })
  pngUrl: string;

  @Column({ name: 'device_info', nullable: true })
  deviceInfo: string;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'signed_at' })
  signedAt: Date;
}
