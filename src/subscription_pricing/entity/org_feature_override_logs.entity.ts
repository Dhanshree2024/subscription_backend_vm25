import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity('org_feature_override_logs', { schema: 'pricing' })
  export class OrgFeatureOverrideLog {
    @PrimaryGeneratedColumn()
    log_id: number;
  
    @Column()
    override_id: number;
  
    @Column()
    org_id: number;
  
    @Column()
    plan_id: number;
  
    @Column()
    feature_id: number;
  
    @Column({ nullable: true })
    mapping_id: number;
  
    @Column({ type: 'text', nullable: true })
    old_value: string;
  
    @Column({ type: 'text', nullable: true })
    new_value: string;
  
    @Column({ nullable: true })
    changed_by: number;
  
    @CreateDateColumn({ type: 'timestamp' })
    changed_at: Date;
  
    @Column({ type: 'varchar', length: 20 })
    action: 'INSERT' | 'UPDATE' | 'DELETE';
  }
  