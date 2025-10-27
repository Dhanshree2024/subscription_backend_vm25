import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne } from "typeorm";

@Entity("asset_status_types")
export class AssetStatusTypes {

    @PrimaryGeneratedColumn()
    status_type_id:number

    @Column()
    status_type_name:string

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

    @Column()
    status_color_code: string

}   
