import { Entity,PrimaryGeneratedColumn,Column } from "typeorm";

@Entity("asset_status_types")
export class AssetsStatus {
    
    @PrimaryGeneratedColumn()
    status_type_id:number

    @Column()
    status_type_name:string

    @Column()
    status_color_code:string

    @Column()
    is_active:number

    @Column()
    is_deleted:number  

    @Column()
    asset_status_description: string

     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
}
