
import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetsScript {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }


    async createAssetsTable(schemaName: string): Promise<void> {

        await this.dataSource.query(`
            
            CREATE TABLE IF NOT EXISTS ${schemaName}.assets
                (
                    asset_id SERIAL PRIMARY KEY,
                    asset_main_category_id integer NOT NULL,
                    asset_sub_category_id integer NOT NULL,
                    asset_item_id integer NOT NULL,
                    asset_information_fields text COLLATE pg_catalog."default",
                    asset_description text COLLATE pg_catalog."default",
                    asset_added_by integer NOT NULL,
                    asset_is_active integer NOT NULL DEFAULT 1,
                    asset_is_deleted integer NOT NULL DEFAULT 0,
                    asset_created_at date NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    asset_updated_at date NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    asset_title text COLLATE pg_catalog."default",
                    manufacturer text COLLATE pg_catalog."default",
                    model_no text COLLATE pg_catalog."default",
                    asset_project integer,
                    asset_location integer,
                    asset_cost_center integer,
                    documents text COLLATE pg_catalog."default",
                    CONSTRAINT assets_asset_added_by_fkey FOREIGN KEY (asset_added_by)
                        REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION,
                    CONSTRAINT assets_asset_main_category_id_fkey FOREIGN KEY (asset_main_category_id)
                        REFERENCES ${schemaName}.asset_main_category (main_category_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION,
                    CONSTRAINT assets_asset_sub_category_id_fkey FOREIGN KEY (asset_sub_category_id)
                        REFERENCES ${schemaName}.asset_sub_category (sub_category_id) MATCH SIMPLE
                        ON UPDATE NO ACTION
                        ON DELETE NO ACTION
                )
        `);
    }


}