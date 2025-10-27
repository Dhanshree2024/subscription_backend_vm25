import { 
    Entity, PrimaryGeneratedColumn, Column, 
    ManyToOne, CreateDateColumn, UpdateDateColumn, 
    JoinColumn 
  } from 'typeorm';
  import { Plan } from './plan.entity';
  import { Feature } from './feature.entity';
  import { PlanFeatureMapping } from './plan-feature-mapping.entity';
  @Entity('limitations', { schema: 'pricing' })
  export class OrgFeatureOverride {
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
  
    // 🔗 Relationships
    @ManyToOne(() => PlanFeatureMapping, (mapping) => mapping.overrides, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mapping_id', referencedColumnName: 'mapping_id' })
    mapping: PlanFeatureMapping;

    @ManyToOne(() => Feature, (feature) => feature.featureMappings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id', referencedColumnName: 'feature_id' })
    feature: Feature;
  }
  