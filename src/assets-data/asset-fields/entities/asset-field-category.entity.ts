import { Entity,PrimaryGeneratedColumn,Column } from "typeorm";

@Entity("asset_field_category")
export class AssetFieldCategory {

    @PrimaryGeneratedColumn()
    asset_field_category_id:number

    @Column()
    asset_field_category_name:string

    @Column()
    asset_field_category_description:string

    @Column()
    parent_organization_id:number

    @Column()
    added_by:number

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

    @Column()
    created_at:Date

    @Column()
    updated_at:Date

}
