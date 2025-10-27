import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class assetFieldCategoryScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




    async createAssetFieldCategoryScriptTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.asset_field_category
              (
                  asset_field_category_id SERIAL PRIMARY KEY,
                  asset_field_category_name text COLLATE pg_catalog."default",
                  asset_field_category_description text COLLATE pg_catalog."default",
                  parent_organization_id integer,
                  added_by integer,
                  is_active integer DEFAULT 1,
                  is_deleted integer DEFAULT 0,
                  created_at date,
                  updated_at date
                  
              )

        `);
    }

     async insertFieldCategoryTable(
        schemaName: string,
        categories: { asset_field_category_name: string }[]
      ): Promise<void> {
        const categoryInsertQuery = `INSERT INTO ${schemaName}.asset_field_category(asset_field_category_name) VALUES ($1);`;

        await Promise.all(
          categories.map(category => {
            return this.dataSource.query(categoryInsertQuery, [category.asset_field_category_name]);
          })
        );
      }

}