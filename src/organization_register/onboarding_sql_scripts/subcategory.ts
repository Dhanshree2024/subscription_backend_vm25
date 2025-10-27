import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class SubCategoryScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }




    async createSubCategoryTable(schemaName: string): Promise<void> {
       
            await this.dataSource.query(`
            
           CREATE TABLE IF NOT EXISTS ${schemaName}.asset_sub_category
          (
              sub_category_id SERIAL PRIMARY KEY,
              main_category_id integer,
              parent_organization_id integer,
              sub_category_name text COLLATE pg_catalog."default",
              sub_category_description text COLLATE pg_catalog."default",
              added_by integer,
              is_active integer NOT NULL DEFAULT 1,
              is_deleted integer NOT NULL DEFAULT 0,
              created_at date,
              updated_at date,
              sub_category_icon text COLLATE pg_catalog."default" DEFAULT 'box'::text,
              
              CONSTRAINT asset_sub_category_main_category_id_fkey FOREIGN KEY (main_category_id)
                  REFERENCES ${schemaName}.asset_main_category (main_category_id) MATCH SIMPLE
                  ON UPDATE NO ACTION
                  ON DELETE NO ACTION
          )
        `);
    }

    async insertAssetSubCategoryTable(
        schemaName: string,
        subCategories: { main_category_id: number, sub_category_name: string }[]
      ): Promise<void> {
        const subCategoryInsertQuery = `
          INSERT INTO ${schemaName}.asset_sub_category(main_category_id, sub_category_name)
          VALUES ($1, $2);
        `;

        await Promise.all(
          subCategories.map(subCategory => {
            return this.dataSource.query(subCategoryInsertQuery, [
              subCategory.main_category_id,
              subCategory.sub_category_name.trim() // remove trailing spaces
            ]);
          })
        );
      }

}