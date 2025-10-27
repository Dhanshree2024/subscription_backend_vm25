import { AssetCategory } from "src/assets-data/asset-categories/entities/asset-category.entity";
import { Entity,PrimaryGeneratedColumn,Column, OneToOne, JoinColumn } from "typeorm";

@Entity("asset_sub_category")
export class AssetSubcategory {
    
    @PrimaryGeneratedColumn()
    sub_category_id:number

    @Column()
    main_category_id:number

    @Column()
    parent_organization_id:number

    @Column()
    sub_category_name:string

    @Column()
    sub_category_description:string

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

    @OneToOne(() => AssetCategory)
    @JoinColumn({ name: 'main_category_id' })
    main_category: AssetCategory;
}
