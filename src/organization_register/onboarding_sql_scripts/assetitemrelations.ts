import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException, ExecutionContext } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';


@Injectable()
export class AssetItemRelationScript{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) { }


  async createAssetItemRelationTable(schemaName: string): Promise<void> {

    await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'relation_type' AND n.nspname = '${schemaName}'
          ) THEN
            CREATE TYPE ${schemaName}.relation_type AS ENUM ('Other', 'Accessory', 'Contract', 'Application'); -- Update values as needed
          END IF;
        END
        $$;
      `);
       
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.asset_items_relations
          (
              relation_id SERIAL PRIMARY KEY,
              parent_asset_item_id integer NOT NULL,
              child_asset_item_id integer NOT NULL,
              is_active smallint DEFAULT 1,
              is_deleted smallint DEFAULT 0,
              created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at timestamp with time zone,
              created_by integer,
              updated_by integer,
              relation_type ${schemaName}.relation_type,
             
              CONSTRAINT asset_items_relations_child_asset_item_id_fkey FOREIGN KEY (child_asset_item_id)
                  REFERENCES ${schemaName}.asset_items (asset_item_id) MATCH SIMPLE
                  ON UPDATE NO ACTION
                  ON DELETE NO ACTION,
              CONSTRAINT asset_items_relations_created_by_fkey FOREIGN KEY (created_by)
                  REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                  ON UPDATE NO ACTION
                  ON DELETE NO ACTION,
              CONSTRAINT asset_items_relations_parent_asset_item_id_fkey FOREIGN KEY (parent_asset_item_id)
                  REFERENCES ${schemaName}.asset_items (asset_item_id) MATCH SIMPLE
                  ON UPDATE NO ACTION
                  ON DELETE NO ACTION,
              CONSTRAINT asset_items_relations_updated_by_fkey FOREIGN KEY (updated_by)
                  REFERENCES ${schemaName}.users (user_id) MATCH SIMPLE
                  ON UPDATE NO ACTION
                  ON DELETE NO ACTION
          )
      `);
      
    }


    async insertItemRelations(
  schemaName: string,
  relations: { parentItemName: string; childItemName: string; relationType: 'Other' | 'Accessory' | 'Contract' | 'Application'}[]
): Promise<void> {
  for (const relation of relations) {
    // Get parent item ID
    const [parentItem] = await this.dataSource.query(
      `SELECT asset_item_id FROM ${schemaName}.asset_items WHERE asset_item_name = $1`,
      [relation.parentItemName]
    );
    if (!parentItem) continue;

    // Get child item ID
    const [childItem] = await this.dataSource.query(
      `SELECT asset_item_id FROM ${schemaName}.asset_items WHERE asset_item_name = $1`,
      [relation.childItemName]
    );
    if (!childItem) continue;

    // Insert into asset_items_relations
    await this.dataSource.query(
      `INSERT INTO ${schemaName}.asset_items_relations 
        (parent_asset_item_id, child_asset_item_id, relation_type) 
       VALUES ($1, $2, $3)`,
      [
        parentItem.asset_item_id,
        childItem.asset_item_id,
        relation.relationType
      ]
    );
  }
}


}