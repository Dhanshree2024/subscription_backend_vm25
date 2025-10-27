import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,ManyToOne,JoinColumn
  } from 'typeorm';
  import { PlanFeatureMapping } from './plan-feature-mapping.entity';
  import { OrgSubscription } from './org_subscription.entity';
  import { Product } from './product.entity';
  
  @Entity({ name: 'features', schema: 'pricing' })
  export class Feature {
    @PrimaryGeneratedColumn()
    feature_id: number;
  
    @Column({ type: 'varchar', length: 255 })
    feature_name: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    // @Column({ type: 'varchar', length: 50 })
    // data_type: 'number' | 'boolean' | 'string' | 'json';

    @Column({ type: 'boolean', default: false })
    set_limit: boolean;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @OneToMany(() => PlanFeatureMapping, mapping => mapping.feature)
    featureMappings: PlanFeatureMapping[];

    @Column({ default: true })
    is_active: boolean;  
  
    @Column({ default: false })
    is_deleted: boolean;  

    @Column({ type: 'varchar', length: 255 })
    default_value: string;

    @ManyToOne(() => Product, product => product.features, { eager: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'int' })
    product_id: number;
  
  //   @OneToMany(() => OrgSubscription, sub => sub.feature)
  //  subscriptions: OrgSubscription[];
  }
  