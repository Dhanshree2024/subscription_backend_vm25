import { Entity,PrimaryGeneratedColumn,Column } from "typeorm";

@Entity("asset_working_status_types")
export class AssetWorkingStatus {

    @PrimaryGeneratedColumn()
    working_status_type_id:number

    @Column()
    working_status_type_name:string

    @Column()
    working_status_color:string

     @Column()
    working_status_description:string

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
