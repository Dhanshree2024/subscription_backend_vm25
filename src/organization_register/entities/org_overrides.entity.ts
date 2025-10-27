import { 
    Entity, PrimaryGeneratedColumn, Column, 
    ManyToOne, CreateDateColumn, UpdateDateColumn, 
    JoinColumn 
  } from 'typeorm';

  @Entity('org_feature_overrides', { schema: 'public' })
  export class OrgOverride {
    @PrimaryGeneratedColumn()
    override_id: number;
  
    @Column()
    org_id: number;
  
    @Column()
    plan_id: number;
  
    @Column()
    feature_id: number;

    @Column()
    mapping_id: number;
  
    @Column({ type: 'text' })
    override_value: string;
  
    @Column({ default: true })
    is_active: boolean;
  
    @Column({ default: false })
    is_deleted: boolean;
  
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
  
    @Column({ type: 'text', nullable: true })
    default_value: string;
  

  }
  