import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/organizational-profile/entity/organizational-user.entity';
  import { Branch } from 'src/organizational-profile/entity/branches.entity';
  import { Department } from 'src/organizational-profile/entity/department.entity';
  
@Entity('asset_transfer_history')
export class AssetTransferHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  asset_id: number;

  @Column()
  previous_organization_id: number;

  @ManyToOne(() => Branch)
      @JoinColumn({ name: 'previous_organization_id' })
      prev_branch: Branch;
      
  @Column()
  previous_used_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'previous_used_by' }) 
  prev_user: User;
  @Column()
  previous_managed_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'previous_managed_by' }) 
  prev_manager: User;

  @Column()
  new_organization_id: number;
  @ManyToOne(() => Branch)
      @JoinColumn({ name: 'new_organization_id' })
      new_branch: Branch;

  @Column()
  used_by: number;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'used_by' }) 
  new_user: User;

  @Column()
  managed_by: number;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'managed_by' }) 
  new_manager: User;

  @Column()
  system_code: string;
  

  @Column({ type: 'timestamp' })
  transfered_at: Date;

  @Column({ type: 'timestamp' })
  updated_at: Date;

}
