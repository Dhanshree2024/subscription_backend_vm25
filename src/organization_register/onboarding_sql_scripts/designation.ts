import { Injectable} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class DesignationScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createDesignationTable(schemaName: string): Promise<void> {
        await this.dataSource.query(`
            
          CREATE TABLE IF NOT EXISTS ${schemaName}.designations
            (
                designation_id SERIAL PRIMARY KEY,
                designation_name character varying(150) COLLATE pg_catalog."default" NOT NULL,
                created_by_id integer,
                created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                desg_description text COLLATE pg_catalog."default",
                parent_department integer,
                is_active integer DEFAULT 1,
                is_deleted integer DEFAULT 0,
              
                CONSTRAINT designations_designation_name_key UNIQUE (designation_name)
            )

        `);
    }
}