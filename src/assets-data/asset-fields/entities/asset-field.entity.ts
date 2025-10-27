import { AssetFieldCategory } from "./asset-field-category.entity";
import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne } from "typeorm";

@Entity("asset_fields")
export class AssetField {

    @PrimaryGeneratedColumn()
    asset_field_id:number

    @Column()
    asset_field_name:string
    
    @Column()
    asset_field_description:string

    @Column()
    asset_field_label_name:string

    @Column()
    asset_field_type_details:string

    // @Column()
    // asset_field_category_id:number

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

    @Column()
    asset_field_type:string

    @Column()
    is_custom_field:boolean

    // @OneToOne(() => AssetFieldCategory)
    // @JoinColumn({ name: 'asset_field_category_id' })
    // category: AssetFieldCategory;
}   
