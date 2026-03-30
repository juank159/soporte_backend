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
import { ServiceOrder } from '../../orders/entities/service-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'id_number', length: 50 })
  idNumber: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ServiceOrder, (order) => order.customer)
  orders: ServiceOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
