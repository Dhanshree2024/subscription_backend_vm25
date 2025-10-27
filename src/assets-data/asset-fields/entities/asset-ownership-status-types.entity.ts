import { Entity,PrimaryGeneratedColumn,Column,JoinColumn, OneToOne, ManyToMany, ManyToOne } from "typeorm";

@Entity("asset_ownership_status_types")
export class AssetOwnershipStatusTypes {

    @PrimaryGeneratedColumn()
    ownership_status_type_id:number

    @Column()
    ownership_status_type_name:string

    @Column()
    is_active:number

    @Column()
    is_deleted:number  
    
}  