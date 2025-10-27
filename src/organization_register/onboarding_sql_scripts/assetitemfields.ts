import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
 
 
@Injectable()
export class ItemFieldsScript {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }
 
    async createItemFieldsTable(schemaName: string): Promise<void> {
      
        await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_fields
                  (
                      asset_field_id SERIAL PRIMARY KEY,
                      asset_field_name text COLLATE pg_catalog."default",
                      asset_field_description text COLLATE pg_catalog."default",
                      asset_field_label_name text COLLATE pg_catalog."default",
                      asset_field_type_details text COLLATE pg_catalog."default",
                      added_by integer,
                      is_active integer DEFAULT 1,
                      is_deleted integer DEFAULT 0,
                      created_at timestamp without time zone,
                      updated_at timestamp without time zone,
                      asset_field_type text COLLATE pg_catalog."default",
                      is_custom_field boolean,
                      asset_field_category_id integer,
                     
                      CONSTRAINT asset_fields_added_by_fkey FOREIGN KEY (added_by)
                          REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                          ON UPDATE NO ACTION
                          ON DELETE NO ACTION
                  )
        `);
    }


      async insertAssetFieldsTable(
        schemaName: string,
        subCategories: { asset_field_category_id: number, asset_field_name: string, asset_field_label_name:string,asset_field_type:string }[]
      ): Promise<void> {
const itemInsertQuery = `INSERT INTO ${schemaName}.asset_fields(asset_field_category_id, asset_field_name,asset_field_label_name, asset_field_type) VALUES ($1, $2, $3, $4);`;

       
        await Promise.all(
          subCategories.map(subCategory => {
            return this.dataSource.query(itemInsertQuery, [
              subCategory.asset_field_category_id,
              subCategory.asset_field_name, 
              subCategory.asset_field_label_name,
               subCategory.asset_field_type, 
            ]);
          })
        );
      }
}