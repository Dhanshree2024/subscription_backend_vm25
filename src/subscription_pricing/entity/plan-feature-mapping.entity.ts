import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, CreateDateColumn, UpdateDateColumn, Unique, JoinColumn, OneToMany
  } from 'typeorm';
import { Plan } from './plan.entity';
import { Feature } from './feature.entity';
import { OrgFeatureOverride } from './org_feature_overrides.entity';
import { Product } from './product.entity';
  @Entity({ name: 'plan_feature_mappings', schema: 'pricing' })
  @Unique(['plan', 'feature'])
  export class PlanFeatureMapping {
    @PrimaryGeneratedColumn()
    mapping_id: number;

    @Column()
    plan_id: number;
  
    @Column()
    feature_id: number;
  
    @Column({ type: 'jsonb' })
    feature_value: any;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'varchar', default: 'Active' })
    status: string;

    @Column({ name: 'product_id', nullable: true })
    product_id: number;

    @Column({ type: 'boolean', default: false })
    is_trial: boolean;

    @ManyToOne(() => Plan, plan => plan.featureMappings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    @ManyToOne(() => Feature, feature => feature.featureMappings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' }) 
    feature: Feature;

    @OneToMany(() => OrgFeatureOverride, (override) => override.mapping)
    overrides: OrgFeatureOverride[];
  
    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

  }
  