import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 100 })
  entity: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: Record<string, any>;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: Record<string, any>;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;
}
