import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 50, default: 'basic' })
  plan: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ length: 50, nullable: true })
  nit: string;

  @Column({ nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 50, default: 'America/Bogota' })
  timezone: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'warranty_days', default: 30 })
  warrantyDays: number;

  @Column({ name: 'warranty_conditions', type: 'text', nullable: true })
  warrantyConditions: string;

  @Column({ name: 'legal_notice', type: 'text', nullable: true })
  legalNotice: string;

  @Column({ name: 'max_users', default: 10 })
  maxUsers: number;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
