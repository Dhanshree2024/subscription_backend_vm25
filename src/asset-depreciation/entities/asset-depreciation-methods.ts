import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/organizational-profile/entity/organizational-user.entity";
@Entity('asset_depreciation_methods')
export class AssetDepreciationMethods {

  @PrimaryGeneratedColumn()
  depreciation_method_id: number;

  @Column()
  dep_method_name: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column()
  created_by: number;

  @Column()
  updated_by: number;


  @OneToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

   @OneToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;


}
