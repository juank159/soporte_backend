import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum SubscriptionPlan {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', unique: true })
  tenantId: string;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.BASIC })
  plan: SubscriptionPlan;

  @Column({ name: 'max_devices', default: 3 })
  maxDevices: number;

  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  @Column({ name: 'active_devices', default: 0 })
  activeDevices: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
