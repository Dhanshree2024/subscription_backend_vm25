import { Entity,PrimaryGeneratedColumn,Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "src/organizational-profile/entity/organizational-user.entity";
@Entity( "asset_main_category")
export class AssetCategory {

    @PrimaryGeneratedColumn()
    main_category_id:number

    @Column()
    main_category_name:string

    @Column()
    main_category_description:string

    @Column()
    parent_organization_id:number

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

    @Column()
    created_at:Date

    @Column()
    updated_at:Date

    @Column()
    added_by:number

    @ManyToOne(() => User)
    @JoinColumn({ name: 'added_by' }) 
    added_by_user: User;
}
