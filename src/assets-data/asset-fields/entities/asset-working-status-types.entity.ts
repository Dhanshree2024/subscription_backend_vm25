import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne } from "typeorm";

@Entity("asset_working_status_types")
export class AssetWorkingStatusTypes {

    @PrimaryGeneratedColumn()
    working_status_type_id:number

    @Column()
    working_status_type_name:string

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

}  